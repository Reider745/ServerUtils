function prevent(x, y, z, player, name) {
    let zone = PrivatesStorage.searchPrivateZone(Entity.getDimension(player), x, y, z)

    if (zone && !zone[name](player)) {
        Game.prevent();
        return true;
    }

    return false;
}

const OrgCallback = Callback;
const REPLACE = ["ItemUse", "DestroyBlock", "BuildBlock", "BreakBlock"];

this["Callback"] = {
    list: {
        ItemUse: [],
        _ItemUse: function (coords, item, block, is, player) {
            return prevent(coords.x, coords.y, coords.z, player, "canItemUse");
        },
        DestroyBlock: [],
        _DestroyBlock: function (coords, block, player) {
            return prevent(coords.x, coords.y, coords.z, player, "canDestroyBlock");
        },
        BreakBlock: [],
        _BreakBlock: function (blockSource, coords, tile, isDtop, player, item) {
            return prevent(coords.x, coords.y, coords.z, player, "canDestroyBlock");
        },
        BuildBlock: [],
        _BuildBlock: function (coords, block, player) {
            return prevent(coords.x, coords.y, coords.z, player, "canItemUse");
        },
    },
    addCallback(name, func, priority) {
        if (REPLACE.indexOf(name) == -1) {
            OrgCallback.addCallback(name, func, priority || 0);
            return;
        }

        this.list[name].push({
            priority: priority || 0,
            func: func,
        });

        this.list[name].sort(function (a, b) {
            return a.priority - b.priority;
        });
    },
    invokeCallback(name, o1, o2, o3, o4, o5, o6, o7, o8, o9, o10) {
        OrgCallback.invokeCallback(name, o1, o2, o3, o4, o5, o6, o7, o8, o9, o10);
    },
};
var Call = com.zhekasmirnov.innercore.api.runtime.Callback;
function getMapCallback() {
    let field = new Call().getClass().getDeclaredField("callbacks");
    field.setAccessible(true);
    return field.get(null);
}

const callbacks = getMapCallback();
for (let i in REPLACE) {
    let name = REPLACE[i];

    let lambda = Callback.list["_" + name];
    let list = Callback.list[name];
    let arraylist = callbacks.get(name);
    if (arraylist) {
        for (let a = 0; a < arraylist.size(); a++)
            list.push(arraylist.get(a)["function"]);
        arraylist.clear();
    }

    OrgCallback.addCallback(name, function (a, b, c, d, e, g, d) {
        let args = [a, b, c, d, e, g, d];
        if (!lambda.apply(this, args))
            for (let g in list) list[g].apply(this, args);
    });
}
