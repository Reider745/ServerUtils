class GlobalSaves {
    private static SAVES: {[key: string]: any} = {};

    public static getData<T>(name: string): Nullable<T> {
        return GlobalSaves.SAVES[name];
    }

    public static getDataDef<T>(name: string, def: T): T {
        return GlobalSaves.getData(name) || def;
    }

    public static setData<T>(name: string, data: T): void {
        GlobalSaves.SAVES[name] = data;
    }

    static {
        Saver.addSavesScope("server_utils.global_saves", (scope) => GlobalSaves.SAVES = scope, () => this.SAVES);
        Callback.addCallback("LevelLeft", () => GlobalSaves.SAVES = {});
    }
}