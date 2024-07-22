class AuctionCommand extends Command {
    constructor(){
        super([]);
        this.setPermissionUseCommand(Permission.AUCTION_COMMAND);
    }

    public runServer(client: NetworkClient, args: any[]): boolean {
        SkyFactoryAction.open(client.getPlayerUid(), client);
        return true;
    }
}

CommandRegistry.registry("auction", new AuctionCommand());