import { ControlType, HassEntity } from "./types";

export type EntitiesFunc = (predicate: (id: string) => boolean) => HassEntity[];

const MANUAL_ID = 99;
const RUN_ONCE_ID = 254;

const WAITING_STATES = ['waiting'];
const ACTIVE_STATES = ['program', 'once_program', 'manual', 'on'];
const STOPPABLE_STATES = [...ACTIVE_STATES, ...WAITING_STATES]

export const isStation    = (id: string) => id.startsWith('sensor.') && id.endsWith('_status');
export const isProgram    = (id: string) => id.startsWith('binary_sensor.') && id.endsWith('_program_running');
export const isController = (id: string) => id.startsWith('switch.') && id.endsWith('opensprinkler_enabled');
export const isRunOnce = (id: string) => id === 'run_once';
export const isStationProgEnable = (id: string) => id.startsWith('switch.') && id.endsWith('_enabled');

export const getControlType = (id: string) => {
    switch (true) {
        case isStation(id): return ControlType.Station;
        case isProgram(id): return ControlType.Program;
        case isRunOnce(id): return ControlType.RunOnce;
        default: return ControlType.State;
    }
}

export function hasRunOnce(entities: EntitiesFunc) {
    return entities(isStation).some(e => e.attributes.running_program_id === RUN_ONCE_ID);
}
export function hasManual(entities: EntitiesFunc) {
    return entities(isStation).some(e => e.attributes.running_program_id === MANUAL_ID);
}

export const stateWaiting   = (entity: HassEntity) => WAITING_STATES.includes(entity.state);
export const stateStoppable = (entity: HassEntity) => STOPPABLE_STATES.includes(entity.state);
export const stateActivated = (entity: HassEntity) => ACTIVE_STATES.includes(entity.state)

export function osName(entity: HassEntity){
    return entity.attributes.name || entity.attributes.friendly_name
        .replace(/ Station Status$/, '').replace(/ Program Running$/, '').replace(/^OpenSprinkler /, '');
}

export function isEnabled(entity: HassEntity, func: EntitiesFunc) {
    return func(isStationProgEnable).find(e => (
      e.attributes.index == entity.attributes.index &&
      e.attributes.opensprinkler_type == entity.attributes.opensprinkler_type
    ))?.state === 'on';
}
