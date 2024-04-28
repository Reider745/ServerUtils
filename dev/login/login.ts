/*enum LoginStatus {
    waiting,
    register,
    successfully
};

const TIMEOUT_LOGIN = 20 * 20;//20 секунд
const TIMEOUT_REGISTER = 90 * 20;//80 секунд

namespace Login {
    namespace PasswordManager {

        function sha256(string: string): string {
             // TODO: добавить кеш функцию
            return string;
        }

        type SaveScope = {[player: number]: string};
        let passwords: SaveScope = {};

        export function existPassword(player: number): boolean {
            return !!passwords[player];
        }

        export function canPasswordPlayer(player: number, password: string): boolean {
            return passwords[player] == sha256(password);
        }

        export function addPassword(player: number, password: string): void {
            if(existPassword(player)) throw new Error("Не заригистрированная попытка смена пороля");
            
            passwords[player] = sha256(password);
        }

        Saver.addSavesScope("server_utils.password_manager", function(scope: SaveScope): void {
            passwords = scope;
        }, function(): SaveScope {
            return passwords;
        })
    }
    
    const waitings: {[key: number]: number} = {};
    const status: {[key: number]: LoginStatus} = {};

    interface PacketPassword {
        password: string;
    }

    type PacketOpenPasswordWindow = {
        status: LoginStatus
    };

    Translation.addTranslation("Registration on the server", {
        ru: "Регистрация на сервере"
    });

    Translation.addTranslation("Enter the threshold", {
        ru: "Введите пороль"
    });

    Translation.addTranslation("Confirm", {
        ru: "Подвердить"
    });

    Translation.addTranslation("Password", {
        ru: "Пороль"
    });

    let dialog: UiDialogSetting;

    Network.addClientPacket("server_utils.password_open_window", (data: PacketOpenPasswordWindow) => {
        dialog = PopupWindow.newDefaultStyle(data.status == LoginStatus.register ? "Registration on the server" : "Enter the threshold");

        dialog.add(new Setting.SettingKeyboardElement(Translation.translate("Password"), "password").setStyle(undefined, 30));
        dialog.add(new Setting.SettingButtonTextElement(Translation.translate("Confirm")).setClick((dialog) => {
            let packet: PacketPassword = {password: dialog.configs.password};
            Network.sendToServer("server_utils.password_confirm", packet);
        }));

        dialog.setCanExit(false);
        //dialog.openCenter();
    });

    type PacketClose = {};

    Network.addClientPacket("server_utils.password_close", (data: PacketClose) => {
        dialog && dialog.close();
    });

    Network.addServerPacket("server_utils.password_confirm", (client, data: PacketPassword) => {
        if(!data || typeof data.password != "string") return;//проверка на целостность пакета

        const player = client.getPlayerUid();

        if(PasswordManager.existPassword(player)){
            if(PasswordManager.canPasswordPlayer(player, data.password))
                status[player] = LoginStatus.successfully;
            else
                client.disconnect("Invalid password");
        }else
            PasswordManager.addPassword(player, data.password);

        const packet: PacketClose = {}
        client.send("server_utils.password_close", packet);
    });

    function addWating(player: number): void {
        if(PasswordManager.existPassword(player)) var status = LoginStatus.waiting;
        else                                      var status = LoginStatus.register;

        status[player] = status;
        waitings[player] = 0;

        let packet: PacketOpenPasswordWindow = {status};
        let client = Network.getClientForPlayer(player);
        client && client.send("server_utils.password_open_window", packet);
    }

    function removeWating(player: number): void {
        delete status[player];
        delete waitings[player];
    }

    function getStatus(player: number): LoginStatus {
        return status[player];
    }

    const pre_pos:{[key: number]: Vector} = {};
    const pre_look: {[key: number]: LookAngle} = {};

    function tickWating(): void {
        for(let player_str in waitings){
            let player = Number(player_str);
            let tick = waitings[player];
            let status = getStatus(player);

            tick++;
            Entity.addEffect(player, EPotionEffect.BLINDNESS, 250, 3, false, false);

            switch(status){
                case LoginStatus.waiting:
                    tick > TIMEOUT_LOGIN && TIMEOUT_LOGIN != -1 && removeWating(player);

                    break;
                case LoginStatus.register:
                    tick > TIMEOUT_REGISTER && TIMEOUT_REGISTER != -1 && removeWating(player);
                    break;
                case LoginStatus.successfully:
                    removeWating(player);
                    Entity.clearEffect(player, EPotionEffect.BLINDNESS);
                    continue;
                    break;
            }

        }
    }

    Callback.addCallback("tick", () => tickWating());
    Callback.addCallback("ServerPlayerLoaded", (player) => addWating(player));
    Callback.addCallback("ServerPlayerLeft", (player) => addWating(player));
}*/

            /*const pos = pre_pos[player];
            if(pos)
                Entity.setPosition(player, pos.x, pos.y, pos.z);
            pre_pos[player] = Entity.getPosition(player);

            const look = pre_look[player];
            if(look)
                Entity.setLookAngle(player, look.yaw, look.pitch);
            pre_look[player] = Entity.getLookAngle(player);*/