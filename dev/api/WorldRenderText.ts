type COLOR = [number, number, number, number];

type TextInfo = {
    mesh: RenderMesh;
    w: number;
    h: number;
}

type PacketFactory = {
    x: number;
    y: number;
    z: number;

    rx: number,
    ry: number,
    rz: number,

    text: string;
    scale: number;
    color: string;
}

type ClientEntity = {
    x: number;
    y: number;
    z: number;

    anim: Animation.Base;
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
}

class WorldRenderText implements ServerEntity {
    protected static networkType: NetworkEntityType;
    private static symbols: {[symbol: string]: {x: number, y: number, w: number, h: number}} = FileTools.ReadJSON(__dir__+"resources/assets/font_sprite_dump.json");

    public static buildMeshForText(text: string, scale: number = 1, text_color: COLOR = [0, 0, 0, 0]): TextInfo {
        let mesh = new RenderMesh();
        let def_scle = 7;

        let h_scale = 1 * (1 / def_scle * .75) * scale;

        let x = 0;
        let y = 0;

        let width = 0;
        let height = 0;

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

    static {
        this.networkType = new NetworkEntityType("world_render_text");
        this.networkType.setClientAddPacketFactory((target: ServerEntity, entity, client): PacketFactory => {
            return {
                x: target.x,
                y: target.y,
                z: target.z,

                rx: target.rx,
                ry: target.ry,
                rz: target.rz,

                text: target.text,
                scale: target.scale,
                color: target.color
            }
        });
        this.networkType.setClientEntityAddedListener((entity, packet: PacketFactory): ClientEntity => {
            let hex = android.graphics.Color.parseColor(packet.color);
            let info = WorldRenderText.buildMeshForText(packet.text, packet.scale, [
                ((hex >> 24) & 0xFF) / 256, ((hex >> 16) & 0xFF) / 256, ((hex >> 8) & 0xFF) / 256, (hex & 0xFF) / 256
            ]);
            let anim = new Animation.Base(packet.x, packet.y, packet.z);
            rotateMesh(info.mesh, packet.x, packet.y, packet.z, packet.y + packet.ry, packet.rx, packet.ry, packet.rz, 1);
            anim.describe({
                mesh: info.mesh,
                skin: "font_sprite.png"
            })
            anim.load();
            return {x: packet.x, y: packet.y, z: packet.z, anim};
        });
        this.networkType.setClientEntityRemovedListener((target: ClientEntity, entity) => {
            target.anim.destroy();
        });
        this.networkType.setClientListSetupListener((list, target: ServerEntity, entity) => {
            list.setupDistancePolicy(target.x, target.y, target.z, target.dim, 64);
        });
    }

    protected networkEntity: NetworkEntity;
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


    constructor(x: number, y: number, z: number, rx: number, ry: number, rz: number, dim: number, text: string, scale: number, color: string){
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

        this.networkEntity = new NetworkEntity(WorldRenderText.networkType, this);
    }

    public remove(): void {
        this.networkEntity.remove();
    }

    public toJSON(): ServerEntity {
        return {x: this.x, y: this.z, z: this.z, dim: this.dim, text: this.text, scale: this.scale, rx: this.rx,
            ry: this.ry,
            rz: this.rz, color: this.color};
    }


    public static fromJSON(json: ServerEntity): WorldRenderText {
        return new WorldRenderText(json.x, json.y, json.z, json.rx, json.ry, json.rz, json.dim, json.text, json.scale, json.color);
    }
}

type WorldRenderTextScope = {
    renders: {[id: string]: ServerEntity};
};

class ServerRenderTextController {
    private list: {[id: string]: WorldRenderText};

    protected id: string;
    constructor(id: string){
        this.id = id;

        let self = this;
        Saver.addSavesScope("server_utils.world_render_text."+id, (scope: WorldRenderTextScope) => {
            let renders: {[id: string]: WorldRenderText} = {};
            for(let id in scope.renders)
                renders[id] = WorldRenderText.fromJSON(scope.renders[id]);
            self.list = renders;
        }, (): WorldRenderTextScope => {
            let renders: {[id: string]: ServerEntity} = {};
            for(let id in this.list)
                renders[id] = this.list[id].toJSON();
            return {renders};
        })
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

    public add(x: number, y: number, z: number, rx: number, ry: number, rz: number, dim: number, text: string, scale: number = 2, color: string = "#000000"): string {
        let id = String(java.util.UUID.randomUUID().toString());
        this.removeId(id);
        this.list[id] = new WorldRenderText(x, y, z, rx, ry, rz, dim, text, scale, color);
        return id;
    }
}

let DEF_RENDER_CONTROOLER = new ServerRenderTextController("def");

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
    protected controller: ServerRenderTextController;

    constructor(controller: ServerRenderTextController){
        super([CommandArgType.STRING, CommandArgType.NUMBER]);//Добавить текст

        this.setPermissionUseCommand(Permission.WORLD_RENDER_TEXT_COMMAND);
        this.addArgsTypes([CommandArgType.STRING, CommandArgType.NUMBER, CommandArgType.STRING]);//Добавить текст выбрав цвет
        this.addArgsTypes([CommandArgType.STRING]);//Удалить текст(нужен uuid)

        this.controller = controller;
    }

    public runServer(client: NetworkClient, args:  [string, number, string] | [string, number] | [string]): boolean {
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

CommandRegistry.registry("rendertext", new WorldRenderCommand(DEF_RENDER_CONTROOLER));