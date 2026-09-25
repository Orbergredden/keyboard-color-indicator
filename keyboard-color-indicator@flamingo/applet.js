const Applet = imports.ui.applet;
const St = imports.gi.St;
const Settings = imports.ui.settings;
const SignalManager = imports.misc.signalManager;
const KeyboardManager = imports.ui.keyboardManager;

class KeyboardColorIndicator extends Applet.TextIconApplet {
    constructor(metadata, orientation, panel_height, instance_id) {
        super(orientation, panel_height, instance_id);

        this.metadata = metadata;
        this.setAllowedLayout(Applet.AllowedLayout.BOTH);

        // Дефолти (перекриються settings-schema.json)
        this.labelEn = "EN";
        this.labelUa = "UA";
        this.bgEn = "#27ae60";
        this.fgEn = "#ffffff";
        this.bgUa = "#ffd700";
        this.fgUa = "#0057b7";
        this.bgOther = "#7f8c8d";
        this.fgOther = "#ffffff";
        this.fontSize = 14;
        this.bold = true;
        this.borderRadius = 6;
        this.hPadding = 10;
        this.showTooltip = true;

        try {
            this.settings = new Settings.AppletSettings(this, metadata.uuid, instance_id);
            this.settings.bind("label-en", "labelEn", () => this._update());
            this.settings.bind("label-ua", "labelUa", () => this._update());
            this.settings.bind("bg-en", "bgEn", () => this._update());
            this.settings.bind("fg-en", "fgEn", () => this._update());
            this.settings.bind("bg-ua", "bgUa", () => this._update());
            this.settings.bind("fg-ua", "fgUa", () => this._update());
            this.settings.bind("bg-other", "bgOther", () => this._update());
            this.settings.bind("fg-other", "fgOther", () => this._update());
            this.settings.bind("font-size", "fontSize", () => this._update());
            this.settings.bind("bold", "bold", () => this._update());
            this.settings.bind("border-radius", "borderRadius", () => this._update());
            this.settings.bind("h-padding", "hPadding", () => this._update());
            this.settings.bind("show-tooltip", "showTooltip", () => this._update());
        } catch (e) {
            global.logError("keyboard-color-indicator: settings bind failed: " + e);
        }

        this._signalManager = new SignalManager.SignalManager(null);

        try {
            this._inputSourcesManager = KeyboardManager.getInputSourceManager();
            this._signalManager.connect(this._inputSourcesManager, "sources-changed", () => this._update());
            this._signalManager.connect(this._inputSourcesManager, "current-source-changed", () => this._update());
        } catch (e) {
            global.logError("keyboard-color-indicator: cannot get InputSourceManager: " + e);
            this._inputSourcesManager = null;
        }

        this._signalManager.connect(this, "orientation-changed", () => this._update());
        this.actor.add_style_class_name("kbd-color-indicator");

        this._update();
    }

    _keyForSource(source) {
        if (!source)
            return "other";
        // Для XKB: source.xkbLayout = 'us' | 'ua', source.id = 'us' | 'ua'
        let raw = (source.xkbLayout || source.id || source.shortName || "").toString().toLowerCase();
        if (raw === "us" || raw === "en" || raw.startsWith("us"))
            return "en";
        if (raw === "ua" || raw === "uk" || raw.startsWith("ua"))
            return "ua";
        return "other";
    }

    _update() {
        let source = null;
        try {
            if (this._inputSourcesManager)
                source = this._inputSourcesManager.currentSource;
        } catch (e) {
            source = null;
        }

        let key = this._keyForSource(source);
        let text, bg, fg, tooltip;

        if (key === "en") {
            text = this.labelEn || "EN";
            bg = this.bgEn;
            fg = this.fgEn;
        } else if (key === "ua") {
            text = this.labelUa || "UA";
            bg = this.bgUa;
            fg = this.fgUa;
        } else {
            text = source && source.shortName ? source.shortName.toUpperCase() : "?";
            bg = this.bgOther;
            fg = this.fgOther;
        }

        if (source && source.displayName)
            tooltip = source.displayName + " (" + text + ")\nЛКМ: наступна розкладка";
        else
            tooltip = text + "\nЛКМ: наступна розкладка";

        this.set_applet_label(text);

        if (this.showTooltip)
            this.set_applet_tooltip(tooltip);
        else
            this.set_applet_tooltip("");

        // === ГОЛОВНЕ: яскравий фон всього аплету ===
        let weight = this.bold ? "bold" : "normal";
        let style =
            "background-color: " + bg + ";" +
            "color: " + fg + ";" +
            "font-size: " + this.fontSize + "px;" +
            "font-weight: " + weight + ";" +
            "border-radius: " + this.borderRadius + "px;" +
            "padding-left: " + this.hPadding + "px;" +
            "padding-right: " + this.hPadding + "px;";
        this.actor.set_style(style);

        // Текст всередині теж фарбуємо, щоб тема панелі не перебила
        try {
            if (this._applet_label) {
                this._applet_label.set_style(
                    "color: " + fg + ";" +
                    "font-size: " + this.fontSize + "px;" +
                    "font-weight: " + weight + ";"
                );
            }
        } catch (e) {}
    }

    _cycleNext() {
        try {
            let mgr = this._inputSourcesManager;
            if (!mgr || !mgr.currentSource)
                return;
            let cur = mgr.currentSource.index;
            let total = Object.keys(mgr.inputSources).length;
            if (total < 2)
                return;
            mgr.activateInputSourceIndex((cur + 1) % total);
        } catch (e) {
            global.logError("keyboard-color-indicator: cycle failed: " + e);
        }
    }

    on_applet_clicked(event) {
        this._cycleNext();
    }

    on_applet_removed_from_panel() {
        try {
            this._signalManager.disconnectAllSignals();
        } catch (e) {}
    }
}

function main(metadata, orientation, panel_height, instance_id) {
    return new KeyboardColorIndicator(metadata, orientation, panel_height, instance_id);
}
