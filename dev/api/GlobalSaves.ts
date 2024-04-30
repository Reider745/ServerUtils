interface SaveHandler {
    onSave(): void;
    onRead(): void;
}

namespace GlobalSaves {
    let SAVES: {[key: string]: any} = {};
    let handlers: SaveHandler[] = [];

    export function getData<T>(name: string): Nullable<T> {
        return SAVES[name];
    }

    export function getDataDef<T>(name: string, def: T): T {
        return GlobalSaves.getData(name) || def;
    }

    export function setData<T>(name: string, data: T): void {
        SAVES[name] = data;
    }

    export function addHandler(handler: SaveHandler): void {
        handlers.push(handler);
    }

    Saver.addSavesScope("server_utils.global_saves", (scope) => {
        SAVES = scope || {};
        for(let i in handlers)
            handlers[i].onRead();
    }, () => {
        for(let i in handlers)
            handlers[i].onSave();
        return SAVES;
    });
    Callback.addCallback("LevelLeft", () => SAVES = {});
}