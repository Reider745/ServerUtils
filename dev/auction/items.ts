interface ClientItemAuctionJson {
    price: number;
    item: ItemInstance;
    owner: string;
    uuid: string;
}

class ItemAuction {
    private price: number;
    private item: ItemInstance;
    private owner: User;
    private uuid: string

    constructor(item: ItemInstance, price: number, owner: User, uuid: string = String(java.util.UUID.randomUUID().toString())){
        this.item = item;
        this.price = price;
        this.owner = owner;

        this.uuid = uuid;

        this.updateInformation();
    }

    public getPrice(): number {
        return this.price;
    }

    public getItem(): ItemInstance {
        return this.item;
    }

    public getOwner(): User {
        return this.owner;
    }

    public getName(): string {
        return getName(this.item.id, this.item.data);
    }

    public getUUID(): string {
        return this.uuid;
    }

    protected updateInformation(): void {
        
    }

    public toJSON(): ClientItemAuctionJson {
        return {
            price: this.price,
            uuid: this.uuid,
            item: {
                id: this.item.id,
                count: this.item.count,
                data: this.item.data,
                extra: this.item.extra
            },
            owner: this.owner.getUserName()
        }
    }
};

class DescriptionItemAuction extends PopupWindow<ClientItemAuction> {
    protected newUi(addional): UiDialogSetting {
        return addional.dialog;
    }

    public static popup = new DescriptionItemAuction();
}

class ClientItemAuction extends ItemAuction {
    public dialog: UiDialogSetting;

    public updateInfo(user: ClientUser): void {
        this.dialog = new UiDialogSetting(this.getName());

        const owner = this.getOwner();

        let ransom = 1;
        if(this.getOwner().getUserName() == user.getUserName()){
            this.dialog.add(new Setting.SettingTextElement(
                translate("Your margin for redemption: %v%", [user.getRansomAuctionAddedItem()]))
            );
            ransom += user.getRansomAuctionAddedItem() / 100;
        }

        this.dialog.add(new Setting.SettingTextElement(translate("Price: %v", [Math.ceil(this.getPrice() * ransom)])));
        this.dialog.add(new Setting.SettingTextElement(translate("Your money: %v", [user.getMoney()])));
        this.dialog.add(new Setting.SettingTextElement(translate("Owner: %v", [owner.getUserName()])));

        
        const self = this;
        this.dialog.add(new Setting.SettingButtonTextElement(translate("buy", [])).setClick((dialog) => {
            self.list_builder.buy(self);
            dialog.close();
        }));
    }

    private list_builder: ListBuilderAuctionItem;

    public show(list_builder: ListBuilderAuctionItem, x: number, y: number): void {
        this.list_builder = list_builder;
        DescriptionItemAuction.popup.open(x, y, this);
    }

    public static fromJSON(json: ClientItemAuctionJson): ClientItemAuction {
        return new ClientItemAuction(json.item, json.price, new ClientUser(json.owner, false, 0, DEF_MARK_ADDED, DEF_RANSOM_ADDED), json.uuid);
    }
}

interface AuctionItemsSendClient {
    items: ClientItemAuctionJson[];
}


const TouchEventType = com.zhekasmirnov.innercore.api.mod.ui.types.TouchEventType;
class ListBuilderAuctionItem {
    private slot_size: number = 60;
    private count_slots: number = 0;
    private ui_size: number;
    private list: ClientItemAuction[] = [];

    private name: string;

    constructor(name: string){
        this.name = name;
    }

    public setSlotSize(size: number): ListBuilderAuctionItem {
        this.slot_size = size;
        return this;
    }

    public addItemAuction(item: ClientItemAuction): ListBuilderAuctionItem {
        this.list.push(item);
        return this;
    }

    public setItems(packet: AuctionItemsSendClient): void {
        this.list = [];
        for(let i in packet.items)
            this.list.push(ClientItemAuction.fromJSON(packet.items[i]));
    }

    public buy(auctionItem: ClientItemAuction): void {
        let packet: PacketAuctionBuy = {
            uuid: auctionItem.getUUID()
        };
        Network.sendToServer("auction."+this.name+".buy", packet);
    }

    public getCountItems(): number {
        return this.list.length;
    }

    public updateSize(offset: number = 0): number {
        let display_height = UI.getScreenHeight();
        this.count_slots = 0;

        for(var height = 0;height + this.slot_size <= display_height - offset * 2;height += this.slot_size){
            this.count_slots++;
        }

        this.ui_size = height;
        return height;
    }

    public getLineSlots(): number {
        return this.count_slots + COUNT_ITEM_SLOTS_PLUS;
    }

    public getCountslots(): number {
        return this.count_slots;
    }

    public buidlUi(window: UI.Window, y: number, user: ClientUser, offset_list: number): void {
        let elements: UI.ElementSet = {};
        let drawing: any = [
            {type: "color", color: android.graphics.Color.argb(0, 0, 0, 0)}
        ];
        
        let width_size = this.ui_size / this.getCountslots() * this.getLineSlots();
        let location = new UI.WindowLocation( {
            x: 500  - width_size / 2 ,
            y: y,
            width: width_size,
            height: this.ui_size
        });
        
        let size = location.globalToWindow(this.slot_size);
        let i = offset_list;
        let self = this;
        for(let y = 0;y < this.count_slots;y++){
            for(let x = 0;x < this.getLineSlots();x++){
                if(i >= this.list.length) break;
                
                let auction_item = this.list[i];
                auction_item.updateInfo(user);
                let pos_x = x*size;
                let pos_y = y*size;

                elements[x+":"+y] = {
                    type: "slot", 
                    x: pos_x, 
                    y: pos_y, 
                    source: auction_item.getItem(), 
                    size: size,
                    bitmap: "_default_slot_empty",
                    visual: true,
                    onTouchEvent(qfa, event: com.zhekasmirnov.innercore.api.mod.ui.types.TouchEvent){
                        event.type == TouchEventType.MOVE && auction_item.show(self, location.x + location.windowToGlobal(event.x), location.y + location.windowToGlobal(event.y));
                    },
                    clicker: {
                        onClick(){
                            auction_item.show(self, location.x + location.windowToGlobal(pos_x), location.y + location.windowToGlobal(pos_y));
                        }
                    }
                };

                i++;
            }
        }


        window.setContent({
            location: location.asScriptable(),
            drawing: drawing,
            elements: elements
        })
    }
};

interface ServerItemAuctionJson extends ClientItemAuctionJson {
    playerUid: number;
}

class ServerItemAuction extends ItemAuction {
    constructor(item: ItemInstance, price: number, owner: User, uuid?: string){
        super(item, price, owner, uuid);
    }

    public toClientJson(): ClientItemAuctionJson {
        return super.toJSON();
    }

    public toJSON(): ServerItemAuctionJson {
        let json: any = super.toJSON();
        json.playerUid = this.getOwner().getPlayerUid();
        return json;
    }

    private flag: boolean = false;

    public lock(): void {
        this.flag = true;
    }

    public unlock(): void {
        this.flag = false;
    }

    public canLock(): boolean {
        return this.flag;
    }

    public static fromJSON(json: ServerItemAuctionJson): ServerItemAuction {
        return new ServerItemAuction(json.item, json.price, UsersStorage.getUserIfCreate(json.playerUid), json.uuid);
    }
}

interface AuctionItemStorageJson {
    items: {[uuid: string]: ServerItemAuctionJson};
}

class ServerItemStorage {
    private items: {[uuid: string]: ServerItemAuction} = {};

    constructor(name: string, items: {[uuid: string]: ServerItemAuction} = {}){
        this.items = items;

        let self = this;
        Saver.addSavesScope("server_utils.auction.item_storage."+name, (scope: AuctionItemStorageJson) => {
            let items: {[uuid: string]: ServerItemAuction} = {};
            scope.items = scope.items || {};
            for(let uuid in scope.items)
                items[uuid] = ServerItemAuction.fromJSON(scope.items[uuid]);
            self.items = items;
        }, function(): AuctionItemStorageJson {
            return self.toJSON();
        });

        Callback.addCallback("LevelLeft", () => self.items = {});
    }

    public add(item: ServerItemAuction): void {
        this.items[item.getUUID()] = item;
    }

    public get(uuid: string): ServerItemAuction {
        return this.items[uuid];
    }

    public remove(uuid: string): void {
        delete this.items[uuid];
    }

    public toSendClient(): AuctionItemsSendClient {
        let items: ClientItemAuctionJson[] = [];

        for(let i in this.items){
            let item = this.items[i];

            items.push(item.toClientJson());
        }

        return {items};
    }

    public toJSON(): AuctionItemStorageJson {
        let items: {[uuid: string]: ServerItemAuctionJson} = {};
        for(let key in this.items)
            items[key] = this.items[key].toJSON();
        return {items};
    }
}