interface ItemSelectedAndSlot extends ItemSelected {
    slot: number;
}

class CustomItemSelected extends SelectedItemDialog {
    public full_list: any;
    public build(): UiDialogBase {
        super.build();

        let content = this.getUi().getContent();
        let self = this;

        content.elements["search"].clicker.onClick = () => {
            new Keyboard("")
                .getText(function(text){
                    let _items = [];
    
                    for(const item of self.full_list)
                        if(Translation.translate(Item.getName(item._id, 0)).toLowerCase().split(text.toLowerCase()).length > 1)
                            _items.push(item);
    
                    self.close();
                    self.list = 0;
                    self.items = _items;
                    self.openCenter();
                })
                .open();
        };

        content.elements["search"].clicker.onLongClick = () => {
            self.close();
            self.list = 0;
            self.items = self.full_list;
            self.openCenter();
        }
        return this;
    }
}

class SettingInventoryItemSelectedElement extends Setting.SettingIconElement {
    public item: ItemSelected;
    public build(dialog: UiDialogSetting, content: com.zhekasmirnov.innercore.api.mod.ui.window.WindowContent, org_size: Size, size: Size, id: string): UI.Elements[] {
        let items: ItemSelectedAndSlot[] = [];

        for(let slot = 0;slot < 36;slot++){
            let item = Player.getInventorySlot(slot);
            item.id != 0 && items.push({
                id: "",
                _id: item.id,
                fullId: "",
                tag: "",
                slot: slot,
            });
        }

        if(items.length <= 0){
            this.item = {id: "", _id: 0, fullId: "", tag: ""};
            let result = super.build(dialog, content, org_size, size, id);
            result[0].clicker.onClick = function(){};

            dialog.configs[this.configName] = this.item;
            return result;
        }

        this.item = this.item || items[0];
        dialog.configs[this.configName] = this.item;
        let result = super.build(dialog, content, org_size, size, id);

        let self = this;
        result[0].clicker.onClick = function(){
            let item_selected = new CustomItemSelected("Selected item");
            item_selected.setStyle(new MinecraftDialogStyle());
            
            item_selected.items = items;
            item_selected.full_list = items;
            item_selected.getSelectedItem(function(item){
                dialog.configs[self.configName] = item;
                self.item = item;
                dialog.close();
                dialog.build();
                dialog.openCenter();
            })
            .openCenter();
        }
        return result;
    }
}

type PacketAuctionAddedItem = {
    slot: number;
    price: number;
}

type PacketAuctionBuy = {
    uuid: string;
}

class Auction {
    private container: ItemContainer;
    private list_builder: ListBuilderAuctionItem;
    private name: string;

    private server_list: ServerItemStorage;

    constructor(name: string){
        this.container = new ItemContainer();
        this.list_builder = new ListBuilderAuctionItem(name);
        this.name = name;

        let self = this;
        ItemContainer.registerScreenFactory("auction."+name, (container, screen_name) => {
            return self.buildUI(screen_name, container);
        });
        this.container.setClientContainerTypeName("auction."+name);

        this.server_list = new ServerItemStorage(name);

        Network.addServerPacket("auction."+name+".addItem", (client, packet: PacketAuctionAddedItem) => self.addItem(client, client.getPlayerUid(), packet.slot, packet.price));
        Network.addServerPacket("auction."+name+".buy", (client, packet: PacketAuctionBuy) => {
            let item_auction = self.server_list.get(packet.uuid);
            item_auction && self.buy(client, item_auction);
        });
    }

    protected buy(client: NetworkClient, item: ServerItemAuction): void {
        if(item.canLock()) {
            alert_message(client, "It is not possible to process the transaction, the transaction is being processed with another player");
            return;
        }
        item.lock();

        try{
            let user = UsersStorage.getUserIfCreate(client.getPlayerUid());
            let price = item.getPrice();
            let owner = item.getOwner() as ServerUser;

            if(user.getUserName() == owner.getUserName())
                price = Math.ceil(price * (user.getPriviliegeValue("ransom_auction_added_item", DEF_RANSOM_ADDED) / 100 + 1));
            
            if(user.getMoney() - price >= 0){
                
                let it = item.getItem();

                user.addMoney(-price);
                owner.addMoney(price);

                new PlayerActor(user.getPlayerUid()).addItemToInventory(it.id, it.count, it.data, it.extra||null, true);
                let owner_client = Network.getClientForPlayer(owner.getPlayerUid());
                owner_client && message(owner_client, "Your product has been successfully purchased");
                alert_message(client, "You have successfully purchased");

                this.server_list.remove(item.getUUID());
                owner.setData("auctions_slots", Math.max(owner.getDataDef("auctions_slots", 0) - 1, 0));

                Daily.handleBuy(client.getPlayerUid(), item);

                this.container.closeFor(client);
                this.open(client.getPlayerUid(), client);

                return;
            }
        }catch(e){
            alert_message(client, String(e))
        };

        item.unlock();
    }

    protected addItem(client: NetworkClient, playerUid: number, slot: number, price: number): void {
        if(typeof slot != "number" || typeof price != "number") return;

        let user = UsersStorage.getUserIfCreate(playerUid);
        let actor = new PlayerActor(playerUid);
        let item = actor.getInventorySlot(slot);
        let auctions_slots = user.getDataDef("auctions_slots", 0);
        let max_slots = user.getPriviliegeValue("max_auction_added_item", DEF_AUCTION_SLOTS);

        if(item.id != 0 && item.count > 0 && price >= 0 && user.canPermission(Permission.USE_AUCTION) && user.canPermission(Permission.ADDED_ITEM_FOR_AUCTION) && auctions_slots < max_slots){
            // Наценка
            price = Math.ceil(price * (user.getPriviliegeValue("mark_up_auction_added_item", DEF_MARK_ADDED) / 100 + 1));
            
            actor.setInventorySlot(slot, 0, 0, 0, null);
            let server_item = new ServerItemAuction(item, price, user);

            this.server_list.add(server_item);
            user.setData("auctions_slots", ++auctions_slots);
            Daily.handleAddItemAuction(playerUid, server_item);

            this.container.closeFor(client)
            this.open(playerUid, client);
        }
    }

    public addClientItemAuction(item: ClientItemAuction): Auction {
        this.list_builder.addItemAuction(item);
        return this;
    }

    private static getExitFunc(func: (setting: UiDialogSetting) => void): (setting: UiDialogSetting) => void {
        return (dialog) => {
            func(dialog);
        }
    }

    protected addTab(group: UI.WindowGroup, backgroundLocation: UI.WindowLocation, left: boolean, name: string, bitmap1: string, bitmap2: string, y: number, onClick: () => void = () => {}, onLongClick: () => void = () => {}): void {
        let x = backgroundLocation.x + backgroundLocation.width - TAB_OFFSET;
        if(left)
            x = backgroundLocation.x - SIZE_TAB + TAB_OFFSET + 1;

        const bitmap = UI.TextureSource.get(bitmap1);

        const width = bitmap.getWidth();
        const height = bitmap.getHeight();
        const scale = (1000 - 500) / width;

        const HEIGHT = 500;

        let location = new UI.WindowLocation({
            x: x,
            y: backgroundLocation.y + y,
            height: SIZE_TAB,
            width: SIZE_TAB
        });

        const drawingTab: any = [
            {type: "color", color: android.graphics.Color.argb(0, 0, 0, 0)},
            {type: "frame", x: 0, y: 0, width: 1000, height: location.globalToWindow(location.height), bitmap: FRAME_TEXTURE, scale: TAB_FRAME_SCALE},
        ];

        group.addWindow("tab_"+name, {
            location: location.asScriptable(),
            drawing: drawingTab,
            elements: {
                "button": {
                    type: "button",
                    x: 500 - width * scale / 2, y: HEIGHT - height * scale / 2,
                    bitmap: bitmap1,
                    bitmap2: bitmap2,
                    scale: scale,
                    clicker: {
                        onClick: onClick,
                        onLongClick: onLongClick
                    }
                }
            }
        });
    }

    protected buildUI(screen_name: string, container: ItemContainer): UI.IWindow {
        let json = JSON.parse(screen_name);
        let clientUser = ClientUser.fromJSON(json.user);
        this.list_builder.setItems(json.items);

        let group = new UI.WindowGroup();
        let height_size = this.list_builder.updateSize(FRAME_OFFSET);
        let slots = this.list_builder.getCountslots() * this.list_builder.getLineSlots();
        let offset_list = 0;
        let width_size = height_size / this.list_builder.getCountslots() * this.list_builder.getLineSlots();
        let backgroundLocation = new UI.WindowLocation({
            x: 500 - width_size / 2 - FRAME_OFFSET,
            y: Y_OFFSET,
            width: width_size + FRAME_OFFSET * 2,
            height: height_size + FRAME_OFFSET * 2,
        });

        group.setCloseOnBackPressed(true);
        

        let drawing: any = [
            {type: "color", color: android.graphics.Color.argb(0, 0, 0, 0)},
            {type: "frame", x: 0, y: 0, bitmap: FRAME_TEXTURE, width: 1000, height: backgroundLocation.globalToWindow(backgroundLocation.height), scale: MAIN_FRAME_SCALE}
        ];

        let background = new UI.Window({
            drawing: drawing,
            location: backgroundLocation.asScriptable(),
            elements: {}
        });

        let items_list = new UI.Window();
        this.list_builder.buidlUi(items_list, Y_OFFSET + FRAME_OFFSET, clientUser, offset_list);
        let self = this;
        function updateWindow(){
            self.list_builder.buidlUi(items_list, Y_OFFSET + FRAME_OFFSET, clientUser, offset_list);
            items_list.forceRefresh();
        }

        
        
        this.addTab(group, backgroundLocation, false, "exit", BUTTON_EXIT_TEXTURE, BUTTON_EXIT_TEXTURE, 0, () => group.close(), () => group.close());
        this.addTab(group, backgroundLocation, true, "info", "info", "info_gray", 0, () => {
            let dialog = PopupWindow.newDefaultStyle("Daily quests");
            dialog.add(new Setting.SettingTextElement(translate("Your money: %v", [clientUser.getMoney()])));
            Daily.fromJSON(json.daily, dialog).openCenter();
        });

        this.addTab(group, backgroundLocation, true, "left", LEFT_TEXTURE+"_0", LEFT_TEXTURE+"_1", backgroundLocation.height - SIZE_TAB, () => {
            if(offset_list >= slots){
                offset_list -= slots;
                updateWindow();
            }
        });

        this.addTab(group, backgroundLocation, false, "right", RIGHT_TEXTURE+"_0", RIGHT_TEXTURE+"_1", backgroundLocation.height - SIZE_TAB, () => {
            if(offset_list < this.list_builder.getCountItems()){
                offset_list += slots;
                updateWindow();
            }
        });
        
        if(clientUser.canAddedAuctionItem()){
            let self = this;
            this.addTab(group, backgroundLocation, true, "added_item", ADDED_TEXTURE, ADDED_TEXTURE2, backgroundLocation.height - SIZE_TAB - SIZE_TAB - OFFSET_BETWEEN_TABS, () => {
                group.close();
                let dialog = PopupWindow.newDefaultStyle("Added item");
                dialog.setEnableExitButton(true);

                let item_seleted_element = new SettingInventoryItemSelectedElement("item");
                dialog.add(item_seleted_element);
                dialog.add(new Setting.SettingTextElement(
                    translate("The margin for adding to auctions, %v%", [clientUser.getMarkUpAuctionAddedItem()])
                ));
                dialog.add(new Setting.SettingKeyboardElement("Price", "price"));

                delete dialog.configs.item;
                item_seleted_element.item = undefined;

                dialog.setCloseHandler((setting) => {
                    let slot = setting.configs.item && setting.configs.item.slot;
                    let price = setting.configs.price;

                    delete setting.configs.item;
                    item_seleted_element.item = undefined;

                    if(typeof slot == "number" && /^\d+$/.test(price)){
                        price = Number(price);

                        let packet: PacketAuctionAddedItem = {slot, price};
                        Network.sendToServer("auction."+self.name+".addItem", packet);
                    }
                    
                });
                dialog.openCenter();
            });
        }

        group.addWindowInstance("background", background);
        group.addWindowInstance("items_list", items_list);

        group.getWindow("tab_exit")
            .setBlockingBackground(true);

        return group;
    }

    public open(player: number, client: NetworkClient = Network.getClientForPlayer(player)): void {
        let user = UsersStorage.getUserIfCreate(player);
        
        user.canPermission(Permission.USE_AUCTION) && this.container.openFor(client, JSON.stringify({
            user: user.toClientJson(),
            items: this.server_list.toSendClient(),
            daily: Daily.toJSON(player)
        }));
    }

    public setSlotSize(size: number): Auction {
        this.list_builder.setSlotSize(size);
        return this;
    }
};

let SkyFactoryAction = new Auction("global")
    .setSlotSize(75);

Callback.addCallback("ItemUse", (coords, item, block, is, player) => item.id == VanillaItemID.book && SkyFactoryAction.open(player));

Callback.addCallback("OpenAuction", (player) => {
    SkyFactoryAction.open(player)
});