export interface ApiMeta {
  timestamp: string;
  requestId: string;
}

export interface DataInformacion {
  identificacion: string;
  tipoPropietario: string;
  tipo: string;
  telefonos: string;
  email: string;
  nombre: string;
  idSujeto: number;
  matriculaMercantil: string;
  regimenTrib: string;
  fechaDocumento: string;
  fechaDocumentoS: string;
  contacto_mpioccdgo: string;
  contacto_dptoccdgo: string;
  contacto_ciudad: string;
  contacto_dpto: string;
  contacto_direccion: string;
  idmerge: number;
  grupo: string;
  edad?: number;
}

export interface DataPrediales {
  barmanpre: string;
  predirecc: string;
  chip: string;
  desde: number;
  hasta: number;
  year: number;
  avaluo_catastral: number;
  impuesto_predial: number;
  precuso: string;
  preaconst: number;
  estrato: number;
  num_propiedades_activas: number;
  tuvo_hipoteca: boolean;
  fecha_ultima_hipoteca: string | null;
  hipoteca_vigente: boolean;
  num_hipotecas_vigentes: number;
  edad: number;
}

export interface DataVehiculo {
  id: number;
  fuente: string;
  horaentrada: string | null;
  horasalida: string | null;
  tiempo: string | null;
  yearsearch: number;
  tipoID: string;
  nombre: string;
  numID: string;
  calidad: string;
  procProp: string;
  fechaDesde: string;
  fechaHasta: string | null;
  anio: number;
  avaluo: number;
  tarifa: number;
  claseSDH: string | null;
  placa: string;
  idServicio: string;
  idEstado: string;
  watts: number | null;
  clasicoAntig: string;
  tipoVeh: number;
  capacidadPas: number;
  capacidadTon: number;
  opcionUso: string;
  objetoCont: string;
  capacidadCarga: number;
  carroceria: string;
  clase: string | null;
  linea: string;
  marca: string;
  modelo: number;
  porcentajeRespon: number;
  responsable: string;
  tipoServicio: string;
  vehiculos: string;
  fecha_consulta: string;
}

export interface DataApiVehiculo {
  capacidadCarga: number;
  carroceria: string;
  clase: string;
  linea: string;
  marca: string;
  modelo: number;
  placa: string;
  porcentajeRespon: string;
  responsable: string;
  tipoServicio: string;
  identificacion: string;
}

export interface DataId2Vehiculo {
  id: number;
  identificacion: string;
  placa: string;
  capacidadCarga: number;
  carroceria: string;
  clase: string;
  linea: string;
  marca: string;
  modelo: number;
  porcentajeRespon: number;
  responsable: string;
  tipoServicio: string;
  fecha_consulta: string;
  fecha_actualizacion: string;
}

export interface LeadsApiResponse {
  meta: ApiMeta;
  data_informacion: DataInformacion[];
  data_prediales: DataPrediales[] | string;
  data_transacciones: string | Record<string, unknown>[];
  data_id_2_vehiculo: string | DataId2Vehiculo[];
  data_vehiculos: DataVehiculo[] | string;
  data_api_vehiculo: DataApiVehiculo[] | string;
}

export interface SearchByDocumentPayload {
  tipoDocumento: string;
  numeroDocumento: string;
  codVerificacion?: string;
}

export interface SearchByPhonePayload {
  telefono: string;
}

export interface SearchByEmailPayload {
  searchEmail: string;
}

export interface SearchByPlatePayload {
  placa: string;
}

export type SearchPayload =
  | SearchByDocumentPayload
  | SearchByPhonePayload
  | SearchByEmailPayload
  | SearchByPlatePayload;
