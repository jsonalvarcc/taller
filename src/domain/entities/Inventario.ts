export class Categoria {
  constructor(
    public readonly id: number,
    public readonly nombre: string,
    public readonly prefijo: string,
    public readonly createdAt: Date
  ) { }
}

export class PlantillaItem {
  constructor(
    public readonly id: number,
    public readonly nombre: string,
    public readonly fabricante: string,
    public readonly modelo: string,
    public readonly prefijo: string,
    public readonly categoriaId: number,
    public readonly createdAt: Date,
    public readonly imagenes?: string[]
  ) { }
}

export class Item {
  constructor(
    public readonly id: number,
    public readonly codigo: string,
    public readonly descripcion: string,
    public readonly observacion: string,
    public readonly ubicacion: string,
    public readonly estado: string,
    public readonly plantillaId: number,
    public readonly createdAt: Date,
    public readonly imagenes?: string[],
    public readonly piezas?: Pieza[],
    public readonly novedades?: Novedad[]
  ) { }
}

export class Pieza {
  constructor(
    public readonly id: number,
    public readonly nombre: string,
    public readonly cantidad: number,
    public readonly observacion: string,
    public readonly itemId: number,
    public readonly createdAt: Date,
    public readonly estado: string = "Disponible",
    public readonly imagenes?: string[],
    public readonly novedades?: Novedad[]
  ) { }
}

export class Novedad {
  constructor(
    public readonly id: number,
    public readonly tipo: string,
    public readonly descripcion: string,
    public readonly fecha: Date,
    public readonly itemId: number,
    public readonly userId: string,
    public readonly itemNuevoEstado: string | null = null,
    public readonly usuarioNombre?: string,
    public readonly detalles?: DetalleNovedadPieza[],
    public readonly itemCodigo?: string,
    public readonly itemImagenes?: string[]
  ) { }
}

export class DetalleNovedadPieza {
  constructor(
    public readonly id: number,
    public readonly novedadId: number,
    public readonly piezaId: number,
    public readonly cantidad: number | null,
    public readonly nuevoEstado: string | null,
    public readonly descripcion: string | null = null,
    public readonly piezaNombre?: string,
    public readonly piezaImagenes?: string[]
  ) { }
}
