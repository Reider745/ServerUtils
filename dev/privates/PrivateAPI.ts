interface PrivateZoneBaseJson {
    type: string,
    owner: string,
    players: {[key: string]: boolean},
}

interface PrivateZoneDimensionJson extends PrivateZoneBaseJson {
    dimension: number
}

interface PrivateZoneFullJson extends PrivateZoneDimensionJson {
    minx: number,
    miny: number,
    minz: number,

    maxx: number,
    maxy: number,
    maxz: number,
}

class PrivateZoneBase {
    protected owner: string;
    protected players: {[key: string]: boolean} = {};

    constructor(json: PrivateZoneBaseJson){
        this.owner = json.owner;
        this.players = json.players;
    }

    public addPermission(player: number): void {
        this.players[UsersStorage.getUserIfCreate(player).getUserName()] = true;
    }

    public removePermission(player: number): void {
        delete this.players[UsersStorage.getUserIfCreate(player).getUserName()];
    }

    protected canPermission(player: string): boolean {
        return this.players[player];
    }

    public canOwner(player: number): boolean {
        return UsersStorage.getUserIfCreate(player).getUserName() === this.owner;
    }

    public canDestroyBlock(player: number, x: number, y: number, z: number): boolean {
        const user = UsersStorage.getUserIfCreate(player);
        const nickname = user.getUserName();

        if(nickname === this.owner || this.canPermission(nickname) || user.isOperator()) return true;

        return false;
    }

    public canItemUse(player: number, x: number, y: number, z: number): boolean {
        return this.canDestroyBlock(player, x, y, z);
    }

    public canPoint(dimension: number, x: number, y: number, z: number): boolean {
        return false;
    }

    public getType(): string {
        return "base";
    }

    public toJSON(): PrivateZoneBaseJson {
        return {
            type: this.getType(),
            owner: this.owner,
            players: this.players
        };
    }
}

class PrivateZoneDimension extends PrivateZoneBase {
    protected dimension: number;

    constructor(json: PrivateZoneDimensionJson){
        super(json);
        this.dimension = json.dimension;
    }

    public canPoint(dimension: number, x: number, y: number, z: number): boolean {
        return this.dimension == dimension;
    }

    public getType(): string {
        return "dimension";
    }

    public toJSON(): PrivateZoneDimensionJson {
        return {
            type: this.getType(),
            owner: this.owner,
            players: this.players,

            dimension: this.dimension
        }
    }
}

class PrivateZoneFullPos extends PrivateZoneDimension {
    protected minx: number;
    protected miny: number;
    protected minz: number;
    protected maxx: number;
    protected maxy: number;
    protected maxz: number;

    constructor(json: PrivateZoneFullJson){
        super(json);
        this.minx = json.minx;
        this.miny = json.miny;
        this.minz = json.minz;

        this.maxx = json.maxx;
        this.maxy = json.maxy;
        this.maxz = json.maxz;

        this.dimension = json.dimension;
    }

    public canPoint(dimension: number, x: number, y: number, z: number): boolean {
        return this.dimension == dimension && 
            (this.minx >= x && x <= this.maxy) && 
            (this.miny >= y && y <= this.maxy) && 
            (this.minz >= y && y <= this.maxz);
    }

    public getType(): string {
        return "full";
    }

    public toJSON(): PrivateZoneFullJson {
        return {
            type: this.getType(),
            owner: this.owner,
            players: this.players,

            minx: this.minx,
            miny: this.miny,
            minz: this.minz,

            maxx: this.maxx,
            maxy: this.maxy,
            maxz: this.maxz,

            dimension: this.dimension
        }
    }
}

namespace PrivatesStorage {
    let storages: {[id: string]: PrivateZoneBase} = {};
    let TYPES: {[type: string]: typeof PrivateZoneBase} = {};

    export function fromJSON(json: PrivateZoneBaseJson): PrivateZoneBase {
        return new TYPES[json.type](json);
    }

    export function register(type: string, clazz: typeof PrivateZoneBase): void {
        TYPES[type] = clazz;
    }

    export function searchPrivateZone(dimension: number, x: number, y: number, z: number): Nullable<PrivateZoneBase> {
        for(let id in storages){
            let zone = storages[id];
            if(zone.canPoint(dimension, x, y, z))
                return zone;
        }
        return null;
    }

    export function canZone(id: string): boolean {
        return !!storages[id];
    }

    export function addZone(id: string, zone: PrivateZoneBase): void {
        storages[id] = zone;
    }

    register("base", PrivateZoneBase);
    register("dimension", PrivateZoneDimension);
    register("full", PrivateZoneFullPos);

    type SAVE = {
        zones: {[id: string]: PrivateZoneBaseJson}
    };

    Saver.addSavesScope("server_utils.private_zones", function(scope: SAVE) {
        let zones = scope.zones || {};

        for(let id in zones)
            storages[id] = fromJSON(zones[id]);
    }, function(): SAVE {
        let zones: {[id: string]: PrivateZoneBaseJson} = {};
        for(let id in storages)
            zones[id] = storages[id].toJSON();
        return {zones};
    })
}