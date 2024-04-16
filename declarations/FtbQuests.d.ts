declare class Size {
    public width: number;
    public height: number;

    constructor(width: number, height: number);
}

interface ItemSelected {
    id: string;
    _id: number;
    tag: string;
    fullId: string;
}

declare namespace Setting {
    export class SettingElement {
        public configName: string;

        public getSize(): Size;
        public initConfig(config: any): void;
        public build(dialog: UiDialogSetting, content: UI.WindowContent, org_size: Size, size: Size, id: string): UI.Elements[];
    }

    export class SettingTextElement extends SettingElement {
        public size: number;
        public color: number;
        public func: (dialog: UiDialogSetting) => void;

        constructor(text: string, size?: number);

        public setStyle(color?: number, size?: number): SettingTextElement;
        public setClick(handler: (dialog: UiDialogSetting) => void): SettingTextElement;
    }


    export class SettingKeyboardElement extends SettingTextElement {
        constructor(text: string, configName: string)
    }

    export class SettingIconElement extends SettingElement {
        protected item: ItemSelected;
        public size: number;
        
        constructor(configName: string, size?: number);
    }

    export class SettingItemsElement extends SettingElement {
        public items: ItemSelected[];;
        public line_x;
        public size: number;

        constructor(configName: string, size?: number);

        protected getItems(): ItemSelected[];
    }

    export class SettingButtonElement extends SettingElement {
        public texture: string;
        public scale: number;
        public func: (dialog: UiDialogSetting) => void;

        constructor(texture: string, scale?: number);
        public onClick(func: (dialog: UiDialogSetting) => void): SettingButtonElement;
    }

    export class SettingNumbersElement extends SettingElement {
        constructor(configName: string, min: number, max: number, value: number, _value?: number)
    }

    export class SettingStringsElement extends SettingNumbersElement {
        constructor(configName: string, strings: string[], value: string);
    }

    export class SettingButtonTextElement extends SettingTextElement {
        public bitmap: string;
        public color_frame: number[];

        constructor(text: string, bitmap?: string, color?: number[], size_text?: number);
    }

    export class SettingSlotElement extends SettingElement {
        constructor(item?: ItemInstance, size?: number, texture?: string);

        public setClick(handler: (dialog: UiDialogSetting) => void): SettingSlotElement;
    }

    export class SettingTranslationElement extends SettingButtonTextElement {
        constructor(configName: string, en: string, langs: string[]);
    }

    export class SettingSwitchElement  extends SettingElement {
        constructor(configName: string, scale?: number, def?: boolean);
    }
}

declare class UiDialogBaseStyle {
    public frame: string;
    public size: number;
    public scale: number;
    public color: [number, number, number, number];
    public text: [number, number, number];
    public background: [number, number, number, number];

    constructor(frame?: string, size?: number, scale?: number, color?: [number, number, number, number], text?: [number, number, number], background?: [number, number, number, number]);
}

declare class MinecraftDialogStyle extends UiDialogBaseStyle {
    constructor(text?: [number, number, number], background?: [number, number, number, number]);
}

declare class UiDialogBase {
    public x: number;
    public y: number;
    public style: UiDialogBaseStyle;

    constructor(message: string, x?: number, y?: number);

    public setStyle(style: UiDialogBaseStyle): UiDialogBase;
    public getSize(): Size;
    public openCenter(location?: UI.WindowLocation): void;
    public isDisplay(x?: number, y?: number): boolean;
    public setCanExit(status: boolean): UiDialogBase;
    public build(): UiDialogBase;
    public setPos(x: number, y: number): UiDialogBase;
    public setMessage(message: string): UiDialogBase;
    public getUi(): UI.Window;
    public open(): UiDialogBase;
    public close(): UiDialogBase;

    static getWidthText(message: string, size: number): number;
    static getSize(message: string, size: number): Size;
}

declare class UiDialogSetting extends UiDialogBase {
    public configs: {[key: string]: any};

    constructor(title: string);

    public addElement(element: Setting.SettingElement, newHeigth?: boolean): UiDialogSetting;
    public add(element: Setting.SettingElement, newHeigth?: boolean): UiDialogSetting;
    public setConfig(configs: {[key: string]: any}): UiDialogSetting;
    public getConfig(): {[key: string]: any};
    public setTextureExit(texture: string): UiDialogSetting;
    public setCloseHandler(func: (self: UiDialogSetting) => void ): UiDialogSetting;
    public setEnableExitButton(status: boolean);
    public canEnableExitButton();
}

declare class SelectedItemDialog  extends UiDialogBase {
    public count_x: number;
    public count_y: number;
    public size: number;
    public list;
    public items: ItemSelected[];
    public func: (item: ItemSelected) => void;

    constructor(title: string);

    protected updateList(content: UI.WindowContent, height: number): void;
    public getSelectedItem(func: (item: ItemSelected) => void): SelectedItemDialog;

    static getItemSelectedById(id: number): ItemSelected 
}

declare class Keyboard  {
    public context: any;
    public func: (text: string) => void;
    public default_string: string;

    constructor(default_string: string);

    public getText(func: (text: string) => void): Keyboard;
    public open(): void;
}

declare class AchievementAPI {
    static give(player: number, title: string, description: string, item: ItemInstance): void;
}