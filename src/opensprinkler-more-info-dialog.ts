import { mdiClose } from "@mdi/js";
import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators";
import { computeRTL, fireEvent, HomeAssistant } from "custom-card-helpers";
import { OpensprinklerCardConfig, HassEntity } from "./types";
import { styles } from "./styles";
import "./opensprinkler-state";
import "./opensprinkler-control";
import { OpensprinklerCard } from "./opensprinkler-card";
import { haStyleDialog, haStyleMoreInfo } from "./ha_style";
import { EntitiesFunc, hasRunOnce, isEnabled, isProgram, isStation } from "./helpers";
import { renderState } from "./opensprinkler-state";

export interface MoreInfoDialogParams {
  config: OpensprinklerCardConfig;
}

@customElement("opensprinkler-more-info-dialog")
export class MoreInfoDialog extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) public entities!: EntitiesFunc;
  @property({ attribute: false }) public parent!: OpensprinklerCard;

  @property({ type: Boolean, reflect: true }) public large = false;

  @state() private _config?: OpensprinklerCardConfig | undefined;

  public showDialog(params: MoreInfoDialogParams) {
    this._config = params.config;
    if (!this._config) {
      this.closeDialog();
      return;
    }
    this.large = false;
  }

  public closeDialog() {
    this._config = undefined;
    // fireEvent(this, "dialog-closed", { dialog: this.localName });
  }

  protected render() {
    if (!this._config) {
      return html``;
    }

    const style = computeRTL(this.hass) ? 'direction: rtl' : '';

    return html`
      <ha-dialog
        open
        @closed=${this.closeDialog}
        .heading=${true}
        hideActions
        data-domain=${"opensprinkler"}
        style=${style}
      >
        <div slot="heading" class="heading">
          <ha-header-bar>
            <mwc-icon-button
              slot="navigationIcon"
              dialogAction="cancel"
              .label=${this.hass.localize(
                "ui.dialogs.more_info_control.dismiss"
              )}
            >
              <ha-svg-icon .path=${mdiClose}></ha-svg-icon>
            </mwc-icon-button>
            <div slot="title" class="main-title" @click=${this._enlarge}>
              ${this._config.name}
            </div>
          </ha-header-bar>
        </div>
        <div class="content">
          ${this._renderStates()}
        </div>
      </ha-dialog>
    `;
  }

  private _renderHeading(title: string) {
    return html`<div role="heading" class="header">${title}</div>`;
  }

  private _renderState(domain: string, suffix: string) {
    const entity = this.entities(id => id.startsWith(domain+'.') && id.endsWith(suffix))[0];
    return renderState(entity.entity_id, this.hass, (e:CustomEvent) => this._moreInfo(e));
  }

  private _renderControl(entity: HassEntity) {
    return html`<opensprinkler-control .entity=${entity}
                   .entities=${this.entities} .hass=${this.hass}
                   .input_number=${this._config!.input_number?.entity}
                   @hass-more-info=${this._moreInfo}
                ></opensprinkler-control>`;
  }

  private _renderStates() {
    const runOnceEntity = { entity_id: 'run_once', state: 'on',
                            attributes: { name: 'Run Once' } } as any;

    return [
      this._renderState('switch', 'opensprinkler_enabled'),
      this._renderState('sensor', 'flow_rate'),
      this._renderState('binary_sensor', 'rain_delay_active'),
      this._renderState('sensor', 'rain_delay_stop_time'),
      this._renderState('sensor', 'water_level'),
      this._renderState('binary_sensor', 'sensor_1_active'),
      this._renderState('binary_sensor', 'sensor_2_active'),
      this._renderHeading('Stations'),
      this._config!.input_number ? renderState(this._config!.input_number, this.hass) : '',
    ]
    .concat(this.entities(isStation).filter(s => this._shouldShowEntity(s)).map(s => {
      return this._renderControl(s);
    }))
    .concat([
      this._renderHeading('Programs'),
      hasRunOnce(this.entities) ? this._renderControl(runOnceEntity) : html``,
    ])
    .concat(this.entities(isProgram).filter(s => this._shouldShowEntity(s)).map(s => {
      return this._renderControl(s);
    }));
  }

  private _enlarge() {
    this.large = !this.large;
  }

  private _moreInfo(e: CustomEvent) {
    this.closeDialog();
    fireEvent(this.parent, "hass-more-info", e.detail);
  }

  private _shouldShowEntity(entity: HassEntity) {
    if (this._config!.hide_disabled) return isEnabled(entity, this.entities);
    return true;
  }

  static get styles() {
    return [
      haStyleDialog,
      haStyleMoreInfo,
      styles,
    ];
  }
}
