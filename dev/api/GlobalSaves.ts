interface SaveHandler {
    onSave(): void;
    onRead(): void;
}

class GlobalSaves {
    private static SAVES: {[key: string]: any} = {};
    private static handlers: SaveHandler[] = [];

    public static getData<T>(name: string): Nullable<T> {
        return GlobalSaves.SAVES[name];
    }

    public static getDataDef<T>(name: string, def: T): T {
        return GlobalSaves.getData(name) || def;
    }

    public static setData<T>(name: string, data: T): void {
        GlobalSaves.SAVES[name] = data;
    }

    public static addHandler(handler: SaveHandler): void {
        this.handlers.push(handler);
    }

    static {
        Saver.addSavesScope("server_utils.global_saves", (scope) => {
            GlobalSaves.SAVES = scope;
            for(let i in GlobalSaves.handlers)
                GlobalSaves.handlers[i].onRead();
        }, () => {
            for(let i in GlobalSaves.handlers)
                GlobalSaves.handlers[i].onSave();
            return this.SAVES;
    });
        Callback.addCallback("LevelLeft", () => GlobalSaves.SAVES = {});
    }
}