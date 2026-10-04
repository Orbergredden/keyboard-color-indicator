const Applet = imports.ui.applet;
const Settings = imports.ui.settings;
const SignalManager = imports.misc.signalManager;
const KeyboardManager = imports.ui.keyboardManager;
const Mainloop = imports.mainloop;
const GLib = imports.gi.GLib;

class KeyboardClockIndicator extends Applet.TextIconApplet {
    constructor(metadata, orientation, panel_height, instance_id) {
        super(orientation, panel_height, instance_id);

        this.metadata = metadata;
        this.setAllowedLayout(Applet.AllowedLayout.BOTH);

        // Дефолти (перекриються settings-schema.json)
        this.timeFormat = "%H:%M";
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
            this.settings.bind("time-format", "timeFormat", () => this._update());
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
            global.logError("keyboard-clock: settings bind failed: " + e);
        }

        this._signalManager = new SignalManager.SignalManager(null);

        try {
            this._inputSourcesManager = KeyboardManager.getInputSourceManager();
            this._signalManager.connect(this._inputSourcesManager, "sources-changed", () => this._update());
            this._signalManager.connect(this._inputSourcesManager, "current-source-changed", () => this._update());
        } catch (e) {
            global.logError("keyboard-clock: cannot get InputSourceManager: " + e);
            this._inputSourcesManager = null;
        }

        this._signalManager.connect(this, "orientation-changed", () => this._update());
        this.actor.add_style_class_name("kbd-color-indicator");

        // Оновлення часу раз на секунду
        try {
            this._timeoutId = Mainloop.timeout_add_seconds(1, () => {
                this._update();
                return true; // GLib.SOURCE_CONTINUE
            });
        } catch (e) {
            global.logError("keyboard-clock: cannot create timeout: " + e);
            this._timeoutId = 0;
        }

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

    _colorsForKey(key) {
        if (key === "en")
            return [this.bgEn, this.fgEn];
        if (key === "ua")
            return [this.bgUa, this.fgUa];
        return [this.bgOther, this.fgOther];
    }

    _formatTime() {
        let fmt = (this.timeFormat || "%H:%M").toString().trim() || "%H:%M";
        try {
            let now = GLib.DateTime.new_now_local();
            return now.format(fmt);
        } catch (e) {
            // Fallback на чистий JS, якщо GLib недоступний
            let d = new Date();
            let pad = (n) => (n < 10 ? "0" + n : "" + n);
            return pad(d.getHours()) + ":" + pad(d.getMinutes());
        }
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
        let [bg, fg] = this._colorsForKey(key);

        // Замість EN / UA — поточний час
        let text = this._formatTime();

        let layoutName = "";
        try {
            if (source && source.displayName)
                layoutName = source.displayName;
            else if (source && source.shortName)
                layoutName = source.shortName.toUpperCase();
        } catch (e) {}

        if (this.showTooltip) {
            let tooltip = text;
            try {
                let now = GLib.DateTime.new_now_local();
                tooltip += "\n" + now.format("%A, %d %B %Y");
            } catch (e) {}
            if (layoutName)
                tooltip += "\nРозкладка: " + layoutName;
            tooltip += "\nЛКМ: наступна розкладка";
            this.set_applet_tooltip(tooltip);
        } else {
            this.set_applet_tooltip("");
        }

        this.set_applet_label(text);

        // === Яскравий фон всього аплету (колір = розкладка) ===
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
            global.logError("keyboard-clock: cycle failed: " + e);
        }
    }

    on_applet_clicked(event) {
        this._cycleNext();
    }

    on_applet_removed_from_panel() {
        try {
            if (this._timeoutId)
                Mainloop.source_remove(this._timeoutId);
        } catch (e) {}
        this._timeoutId = 0;
        try {
            this._signalManager.disconnectAllSignals();
        } catch (e) {}
    }
}

function main(metadata, orientation, panel_height, instance_id) {
    return new KeyboardClockIndicator(metadata, orientation, panel_height, instance_id);
}
