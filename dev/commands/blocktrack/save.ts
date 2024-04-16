class Lock {
    private lock_status: boolean;

    public lock(): void {
        this.lock_status = true;
    }

    public unlock(): void {
        this.lock_status = false;
    }

    public canlock(): boolean {
        return this.lock_status;
    }
}

class ListActions {

}

class SubChunk extends Lock {
    public minY: number;
    public maxY: number;

    private actions: {[keys: string]: ListActions} = {};

    constructor(minY: number, maxY: number){
        super();

        this.minY = minY;
        this.maxY = maxY;
    }

    public addBreak(x: number, y: number, z: number): void {
        
    }
}

const COUNT_BLOCKS_CHUNK = 32;
const COUNT_SUB_CHUNK = 256/COUNT_BLOCKS_CHUNK;

class ChunkBlockTrack extends Lock {
    public chunkX: number;
    public chunkZ: number;

    public sub_chunks: SubChunk[] = [];

    constructor(chunkX: number, chunkZ: number){
        super();

        this.chunkX = chunkX;
        this.chunkZ = chunkZ;

        for(let y = 0;y < COUNT_SUB_CHUNK;y++)
            this.sub_chunks.push(new SubChunk(y * COUNT_BLOCKS_CHUNK, (y + 1) * COUNT_BLOCKS_CHUNK));
    }


}

class BlockTrack {
    private static chunks: ChunkBlockTrack[] = [];

    private static saveChunk(chunkX: number, chunkZ: number): void {

    }

    static {
        Callback.addCallback("LevelSelected", (worldName, worldDir) => {

        });

        Callback.addCallback("LevelLeft", () => {

        });
    }
}