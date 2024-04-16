class PopupWindow<T> {
    private ui: UiDialogSetting;

    protected update(dialog: UiDialogSetting, addional: T): void {
        dialog.setStyle(new MinecraftDialogStyle(undefined, [0, 0, 0, 0]));
        dialog.setEnableExitButton(false);
    }

    protected newUi(addional: T): UiDialogSetting {
        return new UiDialogSetting("");
    }

    public open(x: number, y: number, addional: T){
        if(this.ui && this.ui.getUi().isOpened())
            this.ui.close();

        let ui = this.ui = this.newUi(addional);

        this.update(ui, addional);

        ui.setPos(x, y);
        ui.build();
        ui.open();
    }

    public getDialog(): UiDialogSetting {
        return this.ui;
    }

    public static newDefaultStyle(title: string): UiDialogSetting {
        let dialog = new UiDialogSetting(title);

        dialog.setStyle(new MinecraftDialogStyle(undefined, [0, 0, 0, 0]));
        dialog.setEnableExitButton(false);

        return dialog;
    }
}