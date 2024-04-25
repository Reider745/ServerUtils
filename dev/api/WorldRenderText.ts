type COLOR = [number, number, number, number];

type TextInfo = {
    mesh: RenderMesh;
    w: number;
    h: number;
}

interface ServerEntity {
    x: number;
    y: number;
    z: number;
    dim: number;

    rx: number,
    ry: number,
    rz: number,

    text: string;
    scale: number;
    color: string;

    id: string,
    controller_id: string;
}

class ClientEntity {
    private static symbols: {[symbol: string]: {x: number, y: number, w: number, h: number}} = FileTools.ReadJSON(__dir__+"resources/assets/font_sprite_dump.json");

    public static buildMeshForText(text: string, scale: number = 1, text_color: COLOR = [0, 0, 0, 0]): TextInfo {
        let mesh = new RenderMesh();
        let def_scle = 7;

        let h_scale = 1 * (1 / def_scle * .75) * scale;

        let x = 0;
        let y = 0;

        let width = 0;
        let height = h_scale;

        mesh.setColor(text_color[0], text_color[1], text_color[2], text_color[3]);
        mesh.setNormal(0, 0, 1);

        for(let i = 0;i < text.length;i++){
            const symbol = text.charAt(i);
            if(symbol == "\n"){
                y -= h_scale;
                height = Math.max(height, Math.abs(y));
                x = 0;
                continue;
            }else if(symbol == " "){
                x += this.symbols["A"].w * def_scle * scale;
                continue;
            }
            
            let info = this.symbols[symbol];
            if(!info) continue;

            let w_scale = info.w * def_scle * scale;

            mesh.addVertex(x, y, 0, info.x, info.y + info.h);
            mesh.addVertex(x + w_scale, y, 0, info.x + info.w, info.y + info.h);
            mesh.addVertex(x, y + h_scale, 0, info.x, info.y);

            mesh.addVertex(x + w_scale, y, 0, info.x + info.w, info.y + info.h);
            mesh.addVertex(x, y + h_scale, 0, info.x, info.y);
            mesh.addVertex(x + w_scale, y + h_scale, 0, info.x + info.w, info.y);

            x += w_scale;
            width = Math.max(width, x);
        }
        mesh.translate(-width / 2, height / 2, 0);
        return {mesh, w: width, h: height};
    }

    public anim: Animation.Base;
    public packet: ServerEntity;
    public entity: NetworkEntity;

    constructor(entity: NetworkEntity){
        this.entity = entity;
    }

    public updateModel(packet: ServerEntity): void {
        this.packet = packet;

        if(this.anim)
            this.anim.destroy();
        
        this.anim = new Animation.Base(packet.x, packet.y, packet.z);

        let hex = android.graphics.Color.parseColor(packet.color);
        let info = ClientEntity.buildMeshForText(packet.text, packet.scale, [
            ((hex >> 24) & 0xFF) / 256, ((hex >> 16) & 0xFF) / 256, ((hex >> 8) & 0xFF) / 256, (hex & 0xFF) / 256
        ]);
        rotateMesh(info.mesh, packet.x, packet.y, packet.z, packet.y + packet.ry, packet.rx, packet.ry, packet.rz, 1);
        this.anim.describe({
            mesh: info.mesh,
            skin: "font_sprite.png"
        });
        this.anim.load();
    }
}
const networkType: any = new NetworkEntityType("world_render_text");
networkType.setClientAddPacketFactory((target: WorldRenderText, entity, client): ServerEntity => {
    return target.toJSON();
});
networkType.setClientEntityAddedListener((entity: any, packet: ServerEntity): ClientEntity => {
    let entity_client = new ClientEntity(entity);
    entity_client.updateModel(packet);
    RenderTextController.controllers[packet.controller_id].client_list[packet.id] = entity_client;
    return entity_client;
});
networkType.setClientEntityRemovedListener((target: ClientEntity, entity) => {
    target.anim && target.anim.destroy();
});
networkType.setClientListSetupListener((list, target: WorldRenderText, entity) => {
    list.setupDistancePolicy(target.x, target.y, target.z, target.dim, 64);
});
networkType.addClientPacketListener("updateModel", (target: ClientEntity, entity, packet: ServerEntity) => {
    target.updateModel(packet);
});
networkType.addServerPacketListener("sync", (target: WorldRenderText, entity, client: NetworkClient, packet: ServerEntity) => {
    if(UsersStorage.getUserIfCreate(client.getPlayerUid()).canPermission(Permission.WORLD_RENDER_TEXT_COMMAND)){
        for(let key in packet)
            this[key] = packet[key];
        target.updateModel()
    }
});
networkType.addServerPacketListener("removed", (target: WorldRenderText, entity, client: NetworkClient, packet) => {
    if(UsersStorage.getUserIfCreate(client.getPlayerUid()).canPermission(Permission.WORLD_RENDER_TEXT_COMMAND))
        RenderTextController.controllers[target.controller_id].removeId(target.id);
});
class WorldRenderText implements ServerEntity {
    protected networkEntity: NetworkEntity;
    public id: string;
    public controller_id: string;
    public x: number;
    public y: number;
    public z: number;

    public rx: number;
    public ry: number;
    public rz: number;

    public dim: number;
    public text: string;
    public scale: number;
    public color: string;

    constructor(controller_id: string, id: string, x: number, y: number, z: number, rx: number, ry: number, rz: number, dim: number, text: string, scale: number, color: string){
        this.id = id;
        this.controller_id = controller_id;
        this.x = x;
        this.y = y;
        this.z = z;

        this.rx = rx;
        this.ry = ry;
        this.rz = rz;

        this.dim = dim;
        this.text = text;
        this.scale = scale;
        this.color = color;

        this.networkEntity = new NetworkEntity(networkType, this);
    }

    public remove(): void {
        this.networkEntity.remove();
    }

    public updateModel(): void {
        this.networkEntity.send("updateModel", this.toJSON());
    }

    public toJSON(): ServerEntity {
        return {x: this.x, y: this.y, z: this.z, dim: this.dim, text: this.text, scale: this.scale, rx: this.rx,
            ry: this.ry,
            rz: this.rz, color: this.color, id: this.id, controller_id: this.controller_id};
    }


    public static fromJSON(json: ServerEntity): WorldRenderText {
        return new WorldRenderText(json.controller_id, json.id, json.x, json.y, json.z, json.rx, json.ry, json.rz, json.dim, json.text, json.scale, json.color);
    }
}

type WorldRenderTextScope = {
    renders: {[id: string]: ServerEntity};
};

class RenderTextController {
    public static controllers: {[id: string]: RenderTextController} = {};

    private list: {[id: number]: WorldRenderText} = {};
    public client_list: {[id: number]: ClientEntity} = {};
    protected id: string;

    constructor(id: string){
        this.id = id;

        RenderTextController.controllers[id] = this;

        let self = this;
        //: - доп защита от кривового рино
        Saver.addSavesScope("server_utils.world_render_text."+id, (scope: WorldRenderTextScope) => {
            scope.renders = scope.renders || {};
            self.client_list = {};

            let renders: {[id: string]: WorldRenderText} = {};
            for(let id in scope.renders){
                renders[id] = WorldRenderText.fromJSON(scope.renders[id]);
            }

            self.list = renders;
        }, (): WorldRenderTextScope => {
            let renders: {[id: string]: ServerEntity} = {};
            for(let id in this.list)
                renders[id] = this.list[id].toJSON();
            return {renders};
        });
    }

    public remove(x: number, y: number, z: number, dim: number): string {
        for(let id in this.list){
            let text = this.list[id];
            if(text.x == x && text.y == y && text.z == z && text.dim == dim){
                delete this.list[id];
                return id;
            }
        }
        return null;
    }

    public removeId(id: string): string {
        let world = this.list[id];

        if(world){
            world.remove();
            delete this.list[id];
            return id;
        }
        return null;
    }

    protected genId(): string {
        for(var count = 0;this.list[count];count++){}
        return ":"+count;
    }

    public add(x: number, y: number, z: number, rx: number, ry: number, rz: number, dim: number, text: string, scale: number = 2, color: string = "#000000"): string {
        let id = this.genId();
        this.removeId(id);
        this.list[id] = new WorldRenderText(this.id, id, x, y, z, rx, ry, rz, dim, text, scale, color);
        return id;
    }


    public openSettingsClient(): void {
        let dialog = PopupWindow.newDefaultStyle("Edit render text");

        for(let key in this.client_list){
            let entity = this.client_list[key];
            let packet = entity.packet;
            
            dialog.add(
                new Setting.SettingButtonTextElement(String(packet.id))
                    .setClick((dialog) => {
                        dialog.close();

                        let edit_dialog = PopupWindow.newDefaultStyle("Edit "+packet.id);
                        
                        edit_dialog.add(new Setting.SettingTextElement("X"));
                        edit_dialog.add(new Setting.SettingNumbersElement("x", -5, 5, .1, 0));
                        edit_dialog.add(new Setting.SettingTextElement("Y"));
                        edit_dialog.add(new Setting.SettingNumbersElement("y", -5, 5, .1, 0));
                        edit_dialog.add(new Setting.SettingTextElement("Z"));
                        edit_dialog.add(new Setting.SettingNumbersElement("z", -5, 5, .1, 0));

                        edit_dialog.add(new Setting.SettingTextElement("RX"));
                        edit_dialog.add(new Setting.SettingNumbersElement("rx", -5, 5, .1, 0));
                        edit_dialog.add(new Setting.SettingTextElement("RY"));
                        edit_dialog.add(new Setting.SettingNumbersElement("ry", -5, 5, .1, 0));
                        edit_dialog.add(new Setting.SettingTextElement("RZ"));
                        edit_dialog.add(new Setting.SettingNumbersElement("rz", -5, 5, .1, 0));

                        
                        edit_dialog.add(new Setting.SettingTextElement("scale"));
                        edit_dialog.add(new Setting.SettingNumbersElement("scale", -5, 5, 1, 0));

                        edit_dialog.add(new Setting.SettingKeyboardElement(packet.text, "text"));

                        edit_dialog.add(new Setting.SettingButtonTextElement("Syncronized server")
                            .setClick(() => entity.entity.send("sync", packet)));

                        edit_dialog.add(new Setting.SettingButtonTextElement("Removed")
                            .setClick(() => {
                                entity.entity.send("removed", {});
                                edit_dialog.close();
                            })
                        );

                        edit_dialog.setEnableExitButton(true);
                        edit_dialog.setCloseHandler((self) => {
                            packet.x += self.configs.x;
                            packet.y += self.configs.y;
                            packet.z += self.configs.z;

                            packet.rx += self.configs.rx;
                            packet.ry += self.configs.ry;
                            packet.rz += self.configs.rz;

                            packet.scale += self.configs.scale;

                            packet.text = self.configs.text;

                            //preview
                            entity.updateModel(packet);
                        });
                        edit_dialog.openCenter();
                    })
            );
        }

        dialog.openCenter();
    }
}

let DEF_RENDER_CONTROOLER = new RenderTextController("def");

Translation.addTranslation("Added rendering text %v", {
    ru: "Добавлен отрисовочный текст %v"
});

Translation.addTranslation("Removed rendering text %v", {
    ru: "Удален отрисовочный текст %v"
});

Translation.addTranslation("Not found rendering text %v", {
    ru: "Не найден отрисовочный текст %v"
});

class WorldRenderCommand extends Command {
    protected controller: RenderTextController;

    constructor(controller: RenderTextController){
        super([CommandArgType.STRING, CommandArgType.NUMBER]);//Добавить текст

        this.setPermissionUseCommand(Permission.WORLD_RENDER_TEXT_COMMAND);
        this.addArgsTypes([CommandArgType.STRING, CommandArgType.NUMBER, CommandArgType.STRING]);//Добавить текст выбрав цвет
        this.addArgsTypes([CommandArgType.STRING]);//Удалить текст(нужен uuid)

        this.controller = controller;
    }

    public runServer(client: NetworkClient, args:  [string, number, string] | [string, number] | [any]): boolean {
        let playerUid = client.getPlayerUid();
        if(args.length >= 2){
            let pos = Entity.getPosition(playerUid);
            let vec = Entity.getLookVector(playerUid);
            let color = "#000000";

            if(args.length == 3)
                color = args[2];
            while(args[0].indexOf("\\n") != -1)
                args[0] = args[0].replace("\\n", "\n");
            this.message(client, "Added rendering text %v", 
                this.controller.add(pos.x, pos.y, pos.z, vec.x, vec.y, vec.z, Entity.getDimension(playerUid), args[0], args[1], color)
            );
        }else{
            let id = this.controller.removeId(args[0]);

            if(id){
                this.message(client, "Removed rendering text %v", id);
                return true;
            }

            this.message(client, "Not found rendering text %v", args[0]);
        }
        return true;
    }
}

class WorldRenderTextEditCommand extends Command {
    private controller: RenderTextController;

    constructor(controller: RenderTextController){
        super([]);

        this.setPermissionUseCommand(Permission.WORLD_RENDER_TEXT_COMMAND);

        this.controller = controller;
    }

    public runClient(raw_args: any[]): boolean {
        this.controller.openSettingsClient();
        Game.prevent();
        return false;
    }
}

CommandRegistry.registry("rt", new WorldRenderCommand(DEF_RENDER_CONTROOLER));
CommandRegistry.registry("rte", new WorldRenderTextEditCommand(DEF_RENDER_CONTROOLER));