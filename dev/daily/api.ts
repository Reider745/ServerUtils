if(__config__.getBool("daily.enabled")){
    (() => {
        type DateEntrance = {
            month: number,
            day: number
        }

        type Listdays = {[name: string]: DateEntrance};

        function getCurrentDay(): DateEntrance {
            let date = new Date();

            return {
                month: date.getMonth(),
                day: date.getDate()
            };
        }

        Callback.addCallback("ServerPlayerLoaded", (player) => {
            let days: Listdays = GlobalSaves.getDataDef("daily", {});
            let name = String(Entity.getNameTag(player));
            let entrance = days[name];
            let currnet = getCurrentDay();

            if(entrance && (entrance.day != currnet.day || entrance.month != currnet.month)){
                days[name] = currnet;
                Callback.invokeCallback("UpdateEntrance", player, currnet.day, currnet.month, false, true);
            }else{
                days[name] = currnet;
                Callback.invokeCallback("UpdateEntrance", player, currnet.day, currnet.month, !entrance, false);
            }


            GlobalSaves.setData("daily", days);
        });

        Callback.addCallback("ServerPlayerTick", (player) => {
            if(World.getThreadTime() % 500){
                let days: Listdays = GlobalSaves.getDataDef("daily", {});
                if(days){
                    days[Entity.getNameTag(player)] = getCurrentDay();
                    GlobalSaves.setData("daily", days);
                }
            }
        });
    })();

    const startMoney = Number(__config__.getInteger("daily.startMoney"));
    // const daily_reward = Number(__config__.getInteger("daily.daily_reward"));

    Callback.addCallback("UpdateEntrance", (player, day, month, first, aboba) => {
        let user = UsersStorage.getUserIfCreate(player);

        if(first) user.setMoney(startMoney);
        else if(!aboba) user.addMoney(user.getPriviliegeValue("daily_reward", 0));
    });
}

const quests_count = __config__.getInteger("daily.quests_count");

class DailyQuest {
    protected status: boolean = false;
    protected description: string;
    protected money: number;

    constructor(money: number, description: string){
        this.money = money;
        this.description = description;
    }

    public getDescription(): string {
        return this.description;
    }

    public getValues(): any[] {
        return [];
    }

    public handleBuy(playerUid: number, item: ServerItemAuction): void {

    }

    public handleAddItemAuction(player: number, item: ServerItemAuction): void {

    }

    public handleDestroyBlock(player: number, coords: Callback.ItemUseCoordinates, block: Tile): void {

    }

    public handleRecipe(player: number, result: ItemInstance): void {

    }

    public clone(): DailyQuest {
        return this;
    }

    public getIcon(): ItemInstance {
        return {id: 0, count: 0, data: 0};
    }

    public completed(player: number): void {
        this.status = true;
        AchievementAPI.give(player, "Daily quests", translate(this.getDescription(), this.getValues()), this.getIcon());
        UsersStorage.getUserIfCreate(player)
            .addMoney(this.money);
    }

    public canCompleted(): boolean {
        return this.status;
    }
}

type DailyJSON = {
    quests: {description: string, values: any[], completed: boolean}[]
}

class Daily {
    private static quests: {[player: number]: DailyQuest[]} = {}
    private static list_quests: DailyQuest[] = [];

    private static getPlayerQuests(player: number): DailyQuest[] {
        let quests = Daily.quests[player];
        if(!quests)
            quests = this.updateQuests(player);
        return quests;
    }

    public static handleBuy(player: number, item: ServerItemAuction): void {
        let quests = this.getPlayerQuests(player);
        for(let i in quests){
            let quest = quests[i];
            !quest.canCompleted() && quests[i].handleBuy(player, item);
        }
    }

    public static handleAddItemAuction(player: number, item: ServerItemAuction): void {
        let quests = this.getPlayerQuests(player);
        for(let i in quests){
            let quest = quests[i];
            !quest.canCompleted() && quests[i].handleAddItemAuction(player, item);
        }
    }

    public static handleDestroyBlock(player: number, coords: Callback.ItemUseCoordinates, block: Tile): void {
        let quests = this.getPlayerQuests(player);
        for(let i in quests){
            let quest = quests[i];
            !quest.canCompleted() && quests[i].handleDestroyBlock(player, coords, block);
        }
    }

    public static handleRecipe(player: number, result: ItemInstance): void {
        let quests = this.getPlayerQuests(player);
        for(let i in quests){
            let quest = quests[i];
            !quest.canCompleted() && quest.handleRecipe(player, result);
        }
    }

    public static updateQuests(player: number): DailyQuest[] {
        let quests: DailyQuest[] = [];
        let random = new java.util.Random();

        for(let i = 0;i < quests_count;i++)
            quests.push(this.list_quests[random.nextInt(this.list_quests.length)].clone());

        Daily.quests[player] = quests;
        return quests;
    }

    public static registerQuest(quest: DailyQuest): void {
        this.list_quests.push(quest);
    }

    public static toJSON(player: number): DailyJSON {
        let quests: {description: string, values: any[], completed: boolean}[] = [];

        let userquets = this.getPlayerQuests(player);
        for(let i in userquets){
            let quest = userquets[i];
            quests.push({description: quest.getDescription(), values: quest.getValues(), completed: quest.canCompleted()});
        }

        return {quests};
    }

    public static fromJSON(json: DailyJSON, dialog: UiDialogSetting): UiDialogSetting {
        for(let i in json.quests){
            let quest = json.quests[i];
            if(!quest.completed)
                dialog.add(new Setting.SettingTextElement(translate(quest.description, quest.values)));
        }

        return dialog;
    }


    static {
        Callback.addCallback("DestroyBlock", (coords, block, player) => Daily.handleDestroyBlock(player, coords, block));
        Callback.addCallback("VanillaWorkbenchPostCraft", (result, container, player) => Daily.handleRecipe(player, result));
        Callback.addCallback("UpdateEntrance", (player, day, month, first, not_entered_today) => !not_entered_today && Daily.updateQuests(player))
    }
}

Translation.addTranslation("Break %v/%v %v, reward %v", {
    ru: "Слоамайте %v/%v %v, награда %v"
});

class DestroyBlocksQuest extends DailyQuest {
    protected block: Tile;
    protected count: number;
    protected current: number = 0;

    constructor(block: Tile, count: number, money: number) {
        super(money, "Break %v/%v %v, reward %v");

        this.block = block;
        this.count = count;
        this.money = money;
    }

    public handleDestroyBlock(player: number, coords: Callback.ItemUseCoordinates, block: Tile): void {
        if(block.id == this.block.id && block.data == this.block.data){
            this.current++;
            this.current >= this.count && this.completed(player);
        }
    }

    public getValues(): any[] {
        return [this.current, this.count, getName(this.block.id, this.block.data), this.money];
    }

    public getIcon(): ItemInstance {
        return {
            id: this.block.id,
            count: 1,
            data: this.block.data
        }
    }

    public clone(): DailyQuest {
        return new DestroyBlocksQuest(this.block, this.count, this.money);
    }

    private static add(block: Tile, counts: number[], money: number){
        for(let i in counts)
            Daily.registerQuest(new DestroyBlocksQuest(block, counts[i], money));
    }

    static {
        let datas = [0, 1, 3, 5]
        for(let i in datas)
            Daily.registerQuest(new DestroyBlocksQuest({id: VanillaBlockID.stone, data: datas[i]}, 64, 10));

        let counts = [16, 32];

        this.add({id: VanillaBlockID.dirt, data: 0}, counts, 10);
        /*this.add({id: VanillaBlockID.iron_ore, data: 0}, counts, 10);
        this.add({id: VanillaBlockID.gold_ore, data: 0}, counts, 10);
        this.add({id: VanillaBlockID.coal_ore, data: 0}, counts, 10);*/
    }
}

Translation.addTranslation("Buy in auction %v/%v, reward %v", {
    ru: "Купите на аукционе %v/%v, награда %v"
});

class BuyAuctionQuest extends DailyQuest {
    private count: number;
    private current: number = 0;
    private item: ItemInstance = {id: 0, count: 0, data: 0};

    constructor(count: number = 1, money: number){
        super(money, "Buy in auction %v/%v, reward %v");

        this.count = count;
    }

    public getValues(): any[] {
        return [this.current, this.count, this.money];
    }

    public getIcon(): ItemInstance {
        return this.item;
    }

    public clone(): DailyQuest {
        return new BuyAuctionQuest(this.count, this.money);
    }

    public handleBuy(playerUid: number, item: ServerItemAuction): void {
        this.item = item.getItem();

        this.current++;
        if(this.current >= this.count && String(Entity.getNameTag(playerUid)) != String(item.getOwner().getUserName()))
            this.completed(playerUid);
    }

    static {
        Daily.registerQuest(new BuyAuctionQuest(1, 30));
        Daily.registerQuest(new BuyAuctionQuest(2, 50));
        Daily.registerQuest(new BuyAuctionQuest(2, 80));
        Daily.registerQuest(new BuyAuctionQuest(3, 300));
    }
}

Translation.addTranslation("Added item in auction %v/%v, reward %v", {
    ru: "Добавьте предметов на аукцион %v/%v, награда %v"
});

class AddItemAuctionQuest extends DailyQuest {
    private count: number;
    private current: number = 0;
    private item: ItemInstance = {id: 0, count: 0, data: 0};

    constructor(count: number = 1, money: number){
        super(money, "Added item in auction %v/%v, reward %v");

        this.count = count;
    }

    public getIcon(): ItemInstance {
        return this.item;
    }

    public getValues(): any[] {
        return [this.current, this.count, this.money];
    }

    public clone(): DailyQuest {
        return new AddItemAuctionQuest(this.count, this.money);
    }

    public handleAddItemAuction(playerUid: number, item: ServerItemAuction): void {
        this.item = item.getItem();

        this.current++;
        if(this.current >= this.count)
            this.completed(playerUid);
    }

    static {
        Daily.registerQuest(new AddItemAuctionQuest(4, 40));
        Daily.registerQuest(new AddItemAuctionQuest(1, 3));
        Daily.registerQuest(new AddItemAuctionQuest(3, 10));
        Daily.registerQuest(new AddItemAuctionQuest(2, 15));
        Daily.registerQuest(new AddItemAuctionQuest(6, 80));
    }
}

Translation.addTranslation("Craft %v %v/%v, reward %v", {
    ru: "Скрафтите %v %v/%v, награда %v"
});

Translation.addTranslation("Use the %v/%v workbench, %v reward", {
    ru: "Воспользуйтесь верстаком %v/%v, награда %v"
});


class RecipeDailyQuest extends DailyQuest {
    private count: number;
    private current: number = 0;
    private item_craft: number;
    private item: ItemInstance = {id: 0, count: 0, data: 0};

    constructor(item_craft: number, count: number, money: number){
        super(money, item_craft != -1 ? "Craft %v %v/%v, reward %v" : "Use the %v/%v workbench, %v reward");

        this.count = count;
        this.item_craft = item_craft;
    }

    public getValues(): any[] {
        if(this.item_craft != -1)
            return [getName(this.item_craft, 0), this.current, this.count, this.money];
        return [this.current, this.count, this.money];
    }

    public getIcon(): ItemInstance {
        return this.item;
    }

    public clone(): DailyQuest {
        return new RecipeDailyQuest(this.item_craft, this.count, this.money);
    }

    public handleRecipe(player: number, result: ItemInstance): void {
        this.item = result;

        if(this.item_craft != -1){
            if(this.item_craft == result.id){
                this.current += result.count;
            }
        }else
            this.count++;

        if(this.current >= this.count)
            this.completed(player);
    }

    static {
        Daily.registerQuest(new RecipeDailyQuest(VanillaBlockID.planks, 32, 10));

        Daily.registerQuest(new RecipeDailyQuest(VanillaItemID.iron_helmet, 1, 10));
        Daily.registerQuest(new RecipeDailyQuest(VanillaItemID.iron_chestplate, 1, 10));
        Daily.registerQuest(new RecipeDailyQuest(VanillaItemID.iron_leggings, 1, 10));
        Daily.registerQuest(new RecipeDailyQuest(VanillaItemID.iron_boots, 1, 10));
        
        Daily.registerQuest(new RecipeDailyQuest(VanillaBlockID.glowstone, 5, 35));
        Daily.registerQuest(new RecipeDailyQuest(VanillaItemID.bread, 16, 32));
        Daily.registerQuest(new RecipeDailyQuest(VanillaItemID.bucket, 1, 16));

        Daily.registerQuest(new RecipeDailyQuest(-1, 64, 50));
        Daily.registerQuest(new RecipeDailyQuest(-1, 16, 10));
    }


}

class DailyRenderText extends WorldRenderText {
    public genId(controller: RenderTextController): string {
        return this.getType();
    }

    public getType(): string {
        return "daily_quests";
    }

    public getClientType(): string {
        return "daily_quests";
    }

    public getText(player: Nullable<number>): string {
        if(player != null)
            return JSON.stringify(Daily.toJSON(player));
        return "";
    }
}

class ClientRenderText extends ClientEntity {
    protected getText(text: string): string {
        let message = Translation.translate("Daily quests");
        const json = JSON.parse(text);

        for(let i in json.quests){
            let quest = json.quests[i];
            if(!quest.completed)
                message += "\n" + translate(quest.description, quest.values);
        }

        return message;
    }
}

WorldRenderText.register("daily_quests", DailyRenderText);
ClientEntity.register("daily_quests", ClientRenderText);

class DailyRenderTextCommand extends Command {
    constructor(){
        super([]);
    }

    public runServer(client: NetworkClient, args: any[]): boolean {
        DEF_RENDER_CONTROOLER.addForPlayer(client.getPlayerUid(), DailyRenderText);
        return true;
    }
}

CommandRegistry.registry("aboba", new DailyRenderTextCommand());