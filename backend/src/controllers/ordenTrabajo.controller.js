// src/controllers/ordenTrabajo.controller.js — Parte 1/3 (ESM)
import { PrismaClient } from '@prisma/client';
import { subirArchivoGenerico } from '../utils/archivoupload.js';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// 1. Listar todas las órdenes
export const getAllOrdenes = async (req, res) => {
  try {
    const ordenes = await prisma.ordenTrabajo.findMany({
      include: {
        avion: true,
        componente: true,
        empleadosAsignados: { include: { empleado: true } },
        herramientas: { include: { herramienta: true } },
        stockAsignado: { include: { stock: true } },
        registrosTrabajo: {
          orderBy: { fecha: 'asc' },
          select: {
            id: true, empleadoId: true, fecha: true, horas: true,
            trabajoRealizado: true, rol: true
          }
        },
      },
      orderBy: { fechaApertura: 'desc' },
    });
    res.json(ordenes);
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    res.status(500).json({ error: 'Error al obtener órdenes' });
  }
};

export const getOrdenById = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const orden = await prisma.ordenTrabajo.findUnique({
      where: { id },
      include: {
        avion: {
          include: {
            ComponenteAvion: true,
          },
        },
        componente: {
          include: {
            propietario: true,
          },
        },
        empleadosAsignados: {
          include: {
            empleado: true,
          },
        },
        herramientas: {
          include: {
            herramienta: true,
          },
        },
        stockAsignado: {
          include: {
            stock: true,
          },
        },
        registrosTrabajo: {
          orderBy: { fecha: 'asc' },
          select: {
            id: true,
            empleadoId: true,
            fecha: true,
            horas: true,
            trabajoRealizado: true,
            rol: true,
            empleado: { select: { id: true, nombre: true, apellido: true } },
          },
        },
      },
    });

    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    res.json({
      ...orden,
      solicitudFirma: orden.solicitudFirma ? `${baseUrl}/${orden.solicitudFirma}` : null,
      archivoFactura: orden.archivoFactura ? `${baseUrl}/${orden.archivoFactura}` : null,
    });
  } catch (error) {
    console.error('❌ Error al obtener orden:', error);
    res.status(500).json({ error: 'Error al obtener orden' });
  }
};

// 3. Crear nueva orden de trabajo
export const createOrden = async (req, res) => {
  const {
    avionId,
    componenteId,
    solicitud,
    OTsolicitud,
    solicitadoPor,
    solicitudFirma,
    inspeccionRecibida,
    danosPrevios,
    accionTomada,
    observaciones,
    numeroFactura,
    archivoFactura,
    estadoFactura,
    empleados,
    herramientas,
    stock,
    registrosTrabajo,
  } = req.body;

  try {
    const nuevaOrden = await prisma.ordenTrabajo.create({
      data: {
        avionId,
        componenteId,
        solicitud,
        OTsolicitud,
        solicitadoPor,
        solicitudFirma,
        inspeccionRecibida,
        danosPrevios,
        accionTomada,
        observaciones,
        numeroFactura,
        archivoFactura,
        estadoFactura,

        empleadosAsignados: {
          create: empleados?.map((e) => ({
            empleado: { connect: { id: e.id } },
            rol: e.rol, // 'TECNICO' | 'CERTIFICADOR'
          })),
        },

        herramientas: {
          create: herramientas?.map((h) => ({
            herramienta: { connect: { id: h.id } },
          })),
        },
        stockAsignado: {
          create: stock?.map((s) => ({
            stock: { connect: { id: s.id } },
            cantidadUtilizada: s.cantidad,
          })),
        },
        registrosTrabajo: {
          create: registrosTrabajo?.map((r) => ({
            empleado: { connect: { id: r.empleadoId } },
            fecha: new Date(r.fecha),
            horas: r.horas,
          })),
        },
      },
    });

    res.status(201).json(nuevaOrden);
  } catch (error) {
    console.error('Error al crear orden:', error);
    res.status(500).json({ error: 'Error al crear orden' });
  }
};

// fase 2: Actualizar solicitud de firma y solicitado por
export const updateFase2 = async (req, res) => {
  const id = parseInt(req.params.id);
  const { solicitud, solicitadoPor, OTsolicitud } = req.body;
  const archivo = req.files?.solicitudFirma?.[0]?.path;

  try {
    const updated = await prisma.ordenTrabajo.update({
      where: { id },
      data: {
        solicitud,
        solicitadoPor,
        OTsolicitud,
        ...(archivo && { solicitudFirma: archivo }),
      },
    });
    res.json(updated);
  } catch (error) {
    console.error('❌ Error al actualizar fase 2:', error);
    res.status(500).json({ error: 'Error al actualizar fase 2' });
  }
};

// Fase 2: Subir archivo de solicitud de firma
export const subirArchivoOrden = (req, res) =>
  subirArchivoGenerico({
    req,
    res,
    modeloPrisma: prisma.ordenTrabajo, // 👈 este es tu modelo en Prisma
    campoArchivo: 'solicitudFirma',   // 👈 este es el campo que contiene el archivo
    nombreRecurso: 'Orden de trabajo' // 👈 solo para los mensajes de respuesta
  });


  // FASE 3 
export const updateFase3 = async (req, res) => {
  const id = Number(req.params.id);

  // 1) Normalización de inputs
  const raw = req.body || {};
  const inspeccionRecibida = Boolean(raw.inspeccionRecibida);
  const danosPrevios = inspeccionRecibida ? (raw.danosPrevios ?? null) : null; // si NO hay inspección => null
  const accionTomada = raw.accionTomada ?? null;
  const observaciones = raw.observaciones ?? null;

  const herramientas = Array.isArray(raw.herramientas) ? raw.herramientas.map(Number).filter(Boolean) : [];
  const stock = Array.isArray(raw.stock)
    ? raw.stock
        .map((s) => ({ stockId: Number(s.stockId), cantidad: Number(s.cantidad) }))
        .filter((s) => s.stockId && s.cantidad && s.cantidad > 0)
    : [];
  const certificadores = Array.isArray(raw.certificadores) ? raw.certificadores.map(Number).filter(Boolean) : [];
  const tecnicos = Array.isArray(raw.tecnicos) ? raw.tecnicos.map(Number).filter(Boolean) : [];

  // 2) Unicidad por rol (permitir doble rol) + validación opcional de aptitudes
  const certificadoresUnicos = [...new Set(certificadores)];
  const tecnicosUnicos = [...new Set(tecnicos)];

  // (Opcional) Validar aptitudes declaradas del empleado
  const empleadosIds = Array.from(new Set([...certificadoresUnicos, ...tecnicosUnicos]));
  if (empleadosIds.length) {
    const empleadosInfo = await prisma.empleado.findMany({
      where: { id: { in: empleadosIds } },
      select: { id: true, nombre: true, apellido: true, esTecnico: true, esCertificador: true },
    });
    const infoMap = new Map(empleadosInfo.map(e => [e.id, e]));

    for (const eId of tecnicosUnicos) {
      const e = infoMap.get(eId);
      if (!e || !e.esTecnico) {
        return res.status(400).json({
          error: `El empleado ${e ? `${e.nombre} ${e.apellido}` : eId} no está habilitado como TÉCNICO.`,
        });
      }
    }
    for (const eId of certificadoresUnicos) {
      const e = infoMap.get(eId);
      if (!e || !e.esCertificador) {
        return res.status(400).json({
          error: `El empleado ${e ? `${e.nombre} ${e.apellido}` : eId} no está habilitado como CERTIFICADOR.`,
        });
      }
    }
  }

  // 3) Unicidad de herramientas
  const herramientasUnicas = [...new Set(herramientas)];

  try {
    await prisma.$transaction(async (tx) => {
      // A) Stock previamente asignado para calcular diferencias
      const stockPrevio = await tx.ordenStock.findMany({ where: { ordenId: id } });
      const stockMapPrevio = new Map(stockPrevio.map((i) => [i.stockId, i.cantidadUtilizada]));

      // B) Validar que no se consuma más de lo disponible (considerando lo ya asignado antes)
      for (const s of stock) {
        const anterior = stockMapPrevio.get(s.stockId) ?? 0;
        const adicional = Math.max(0, s.cantidad - anterior);
        if (adicional > 0) {
          const item = await tx.stock.findUnique({
            where: { id: s.stockId },
            select: { cantidad: true, nombre: true },
          });
          if (!item) throw new Error(`Stock ID ${s.stockId} inexistente`);
          if (adicional > item.cantidad) {
            throw new Error(
              `No hay stock suficiente de "${item.nombre}". Solicitado adicional: ${adicional}, disponible: ${item.cantidad}.`
            );
          }
        }
      }

      // C) Limpiar asignaciones y actualizar campos
      await tx.ordenTrabajo.update({
        where: { id },
        data: {
          inspeccionRecibida,
          danosPrevios,
          accionTomada,
          observaciones,
          herramientas: { deleteMany: {} },
          stockAsignado: { deleteMany: {} },
          empleadosAsignados: { deleteMany: {} },
        },
      });

      // D) Re-crear herramientas (únicas)
      for (const hId of herramientasUnicas) {
        await tx.ordenHerramienta.create({
          data: { ordenId: id, herramientaId: hId },
        });
      }

      // E) Re-crear stock y ajustar inventario por diferencia vs. previo
      const stockIdsActuales = stock.map((s) => s.stockId);

      for (const s of stock) {
        const anterior = stockMapPrevio.get(s.stockId) ?? 0;
        const diferencia = s.cantidad - anterior;

        if (diferencia > 0) {
          await tx.stock.update({
            where: { id: s.stockId },
            data: { cantidad: { decrement: diferencia } },
          });
        } else if (diferencia < 0) {
          await tx.stock.update({
            where: { id: s.stockId },
            data: { cantidad: { increment: Math.abs(diferencia) } },
          });
        }

        await tx.ordenStock.create({
          data: { ordenId: id, stockId: s.stockId, cantidadUtilizada: s.cantidad },
        });

        // Aviso por stock mínimo
        const stockActual = await tx.stock.findUnique({
          where: { id: s.stockId },
          select: { cantidad: true, stockMinimo: true, nombre: true },
        });

        if (stockActual && stockActual.cantidad <= (stockActual.stockMinimo ?? 0)) {
          const existeAviso = await tx.aviso.findFirst({
            where: {
              mensaje: { contains: `"${stockActual.nombre}"` },
              leido: false,
              tipo: 'stock',
              stockId: s.stockId,
            },
          });
          if (!existeAviso) {
            await tx.aviso.create({
              data: {
                mensaje: `El producto "${stockActual.nombre}" alcanzó el stock mínimo (${stockActual.cantidad} unidades)`,
                leido: false,
                tipo: 'stock',
                stockId: s.stockId,
              },
            });
          }
        }
      }

      // F) Devolver inventario de ítems que existían antes y ahora ya no
      for (const anterior of stockPrevio) {
        if (!stockIdsActuales.includes(anterior.stockId)) {
          await tx.stock.update({
            where: { id: anterior.stockId },
            data: { cantidad: { increment: anterior.cantidadUtilizada } },
          });
        }
      }

      // G) Crear certificadores
      for (const idCert of certificadoresUnicos) {
        await tx.empleadoAsignado.create({
          data: { ordenId: id, empleadoId: idCert, rol: 'CERTIFICADOR' },
        });
      }

      // H) Crear técnicos
      for (const idTec of tecnicosUnicos) {
        await tx.empleadoAsignado.create({
          data: { ordenId: id, empleadoId: idTec, rol: 'TECNICO' },
        });
      }
    });

    // Devolvemos la OT completa para que el front pueda hacer setOrden(updated)
    const ordenActualizada = await prisma.ordenTrabajo.findUnique({
      where: { id },
      include: {
        avion: { include: { ComponenteAvion: true, propietarios: true } },
        componente: { include: { propietario: true } },
        empleadosAsignados: { include: { empleado: true } },
        herramientas: { include: { herramienta: true } },
        stockAsignado: { include: { stock: true } },
        registrosTrabajo: {
          orderBy: { fecha: 'asc' },
          select: {
            id: true,
            empleadoId: true,
            fecha: true,
            horas: true,
            trabajoRealizado: true,
            rol: true,
            empleado: { select: { id: true, nombre: true, apellido: true } },
          },
        },
      },
    });

    return res.json(ordenActualizada);
  } catch (error) {
    console.error('❌ Error al actualizar fase 3:', error);
    const msg = String(error?.message || error);
    if (msg.includes('stock suficiente')) {
      return res.status(400).json({ error: msg });
    }
    return res.status(500).json({ error: 'Error al actualizar fase 3' });
  }
};


// Archivar orden (solo si está cerrada o cancelada)
export const archivarOrden = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const orden = await prisma.ordenTrabajo.findUnique({ where: { id } });

    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    if (!['CERRADA', 'CANCELADA'].includes(orden.estadoOrden)) {
      return res
        .status(400)
        .json({ error: 'Solo se pueden archivar órdenes cerradas o canceladas' });
    }

    const ordenArchivada = await prisma.ordenTrabajo.update({
      where: { id },
      data: { archivada: true },
    });

    res.json({ mensaje: 'Orden archivada con éxito', orden: ordenArchivada });
  } catch (error) {
    console.error('❌ Error al archivar orden:', error);
    res.status(500).json({ error: 'Error al archivar orden' });
  }
};

// 5. Eliminar orden
export const deleteOrden = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.ordenTrabajo.delete({ where: { id } });
    res.json({ mensaje: 'Orden eliminada con éxito' });
  } catch (error) {
    console.error('Error al eliminar orden:', error);
    res.status(500).json({ error: 'Error al eliminar orden' });
  }
};

// Fase 4: crear registro SIN duplicar 
export const crearRegistroTrabajo = async (req, res) => {
  const ordenId = Number(req.params.id);
  const { empleadoId, fecha, horas, trabajoRealizado, rol } = req.body;

  if (!empleadoId || !fecha || !horas || !rol) {
    return res.status(400).json({ error: 'empleadoId, fecha, horas y rol son obligatorios' });
  }
  if (!['TECNICO', 'CERTIFICADOR'].includes(rol)) {
    return res.status(400).json({ error: 'rol inválido' });
  }
  if (Number(horas) <= 0) {
    return res.status(400).json({ error: 'Las horas deben ser > 0' });
  }

  try {
    const empId = Number(empleadoId);
    const h = Number(horas);
    const f = new Date(fecha);
    const desc = (trabajoRealizado ?? '').trim() || null;

    // validar que el empleado esté asignado con ese rol a la OT
    const asignado = await prisma.empleadoAsignado.findFirst({
      where: { ordenId, empleadoId: empId, rol },
      select: { id: true },
    });
    if (!asignado) {
      return res.status(400).json({ error: 'El empleado no está asignado a la OT con ese rol' });
    }

    // ventana: mismo día
    const inicioDia = new Date(f.getFullYear(), f.getMonth(), f.getDate(), 0, 0, 0, 0);
    const finDia = new Date(f.getFullYear(), f.getMonth(), f.getDate() + 1, 0, 0, 0, 0);

    // existe uno equivalente ese día?
    const existente = await prisma.registroDeTrabajo.findFirst({
      where: {
        ordenId,
        empleadoId: empId,
        rol,
        trabajoRealizado: desc,
        fecha: { gte: inicioDia, lt: finDia },
      },
    });

    let registro;
    if (existente) {
      registro = await prisma.registroDeTrabajo.update({
        where: { id: existente.id },
        data: { horas: existente.horas + h },
        include: { empleado: true },
      });
    } else {
      registro = await prisma.registroDeTrabajo.create({
        data: {
          ordenId,
          empleadoId: empId,
          fecha: f,
          horas: h,
          trabajoRealizado: desc,
          rol,
        },
        include: { empleado: true },
      });
    }

    res.json(registro);
  } catch (e) {
    console.error('❌ Error creando registro:', e);
    res.status(500).json({ error: 'Error creando registro' });
  }
};

// Fase 5: Editar registro de trabajo
export const editarRegistroTrabajo = async (req, res) => {
  const ordenId = Number(req.params.id);
  const id = Number(req.params.registroId);
  const { fecha, horas, trabajoRealizado, rol } = req.body;

  if (rol && !['TECNICO', 'CERTIFICADOR'].includes(rol)) {
    return res.status(400).json({ error: 'rol inválido' });
  }
  if (horas !== undefined && Number(horas) <= 0) {
    return res.status(400).json({ error: 'Las horas deben ser > 0' });
  }

  try {
    const actual = await prisma.registroDeTrabajo.findUnique({ where: { id } });
    if (!actual) return res.status(404).json({ error: 'Registro no encontrado' });
    if (actual.ordenId !== ordenId) {
      return res.status(400).json({ error: 'El registro no pertenece a esta OT' });
    }

    if (rol && !await prisma.empleadoAsignado.findFirst({
      where: { ordenId, empleadoId: actual.empleadoId, rol },
      select: { id: true }
    })) {
      return res.status(400).json({ error: 'El empleado no está asignado a la OT con ese rol' });
    }

    const registro = await prisma.registroDeTrabajo.update({
      where: { id },
      data: {
        fecha: fecha ? new Date(fecha) : undefined,
        horas: horas !== undefined ? Number(horas) : undefined,
        trabajoRealizado: trabajoRealizado !== undefined ? trabajoRealizado?.trim() || null : undefined,
        rol: rol || undefined,
      },
      include: { empleado: true },
    });
    res.json(registro);
  } catch (e) {
    console.error('❌ Error editando registro:', e);
    res.status(500).json({ error: 'Error editando registro' });
  }
};

// Fase 4: Subir archivo de factura
export const subirArchivoFactura = (req, res) =>
  subirArchivoGenerico({
    req,
    res,
    modeloPrisma: prisma.ordenTrabajo,
    campoArchivo: 'archivoFactura',
    nombreRecurso: 'Orden de trabajo (factura)',
  });

// Fase 4: Guardar datos de factura (número y estado)
export const guardarDatosFactura = async (req, res) => {
  const id = Number(req.params.id);
  const { numeroFactura, estadoFactura } = req.body || {};
  try {
    const orden = await prisma.ordenTrabajo.update({
      where: { id },
      data: {
        numeroFactura: numeroFactura ?? null,
        estadoFactura: estadoFactura ?? null,
      },
      select: { id: true, numeroFactura: true, estadoFactura: true },
    });
    res.json(orden);
  } catch (e) {
    console.error('❌ Error guardando datos de factura:', e);
    res.status(500).json({ error: 'Error guardando datos de factura' });
  }
};

// Cancelar orden de trabajo
export const cancelarOrden = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const orden = await prisma.ordenTrabajo.findUnique({
      where: { id },
      include: {
        avion: { include: { ComponenteAvion: true, propietarios: true } },
        componente: { include: { propietario: true } },
      },
    });
    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });

    // Si ya hay snapshots, no los recalculo: solo estado + fechaCancelacion
    if (orden.datosAvionSnapshot || orden.datosComponenteSnapshot) {
      const actualizada = await prisma.ordenTrabajo.update({
        where: { id },
        data: { estadoOrden: 'CANCELADA', fechaCancelacion: new Date() },
      });
      return res.json({ mensaje: 'Orden cancelada', orden: actualizada });
    }

    // Caso normal: genero snapshots
    let datosAvionSnapshot = null, datosComponenteSnapshot = null, datosPropietarioSnapshot = null;

    if (orden.avion) {
      const a = orden.avion;
      datosAvionSnapshot = {
        id: a.id, matricula: a.matricula, marca: a.marca, modelo: a.modelo,
        numeroSerie: a.numeroSerie, TSN: a.TSN, vencimientoMatricula: a.vencimientoMatricula,
        vencimientoSeguro: a.vencimientoSeguro, certificadoMatricula: a.certificadoMatricula,
        componentes: a.ComponenteAvion.map(c => ({
          tipo: c.tipo, marca: c.marca, modelo: c.modelo, numeroSerie: c.numeroSerie,
          TSN: c.TSN, TSO: c.TSO, TBOHoras: c.TBOHoras, TBOFecha: c.TBOFecha,
        })),
        propietarios: a.propietarios.map(p => ({
          tipo: p.tipo, nombre: p.nombre, apellido: p.apellido, razonSocial: p.razonSocial,
          rut: p.rut, cedula: p.cedula, email: p.email, telefono: p.telefono,
        })),
      };
      if (a.propietarios.length === 1) {
        const p = a.propietarios[0];
        datosPropietarioSnapshot = {
          tipo: p.tipo, nombre: p.nombre, apellido: p.apellido, razonSocial: p.razonSocial,
          rut: p.rut, cedula: p.cedula, email: p.email, telefono: p.telefono,
        };
      }
    }

    if (orden.componente) {
      const c = orden.componente;
      datosComponenteSnapshot = {
        tipo: c.tipo, marca: c.marca, modelo: c.modelo, numeroSerie: c.numeroSerie,
        TSN: c.TSN, TSO: c.TSO, TBOHoras: c.TBOHoras, TBOFecha: c.TBOFecha, archivo8130: c.archivo8130,
      };
      if (c.propietario) {
        const p = c.propietario;
        datosPropietarioSnapshot = {
          tipo: p.tipo, nombre: p.nombre, apellido: p.apellido, razonSocial: p.razonSocial,
          rut: p.rut, cedula: p.cedula, email: p.email, telefono: p.telefono,
        };
      }
    }

    const ordenCancelada = await prisma.ordenTrabajo.update({
      where: { id },
      data: {
        estadoOrden: 'CANCELADA',
        fechaCancelacion: new Date(),
        datosAvionSnapshot,
        datosComponenteSnapshot,
        datosPropietarioSnapshot,
      },
    });

    res.json({ mensaje: 'Orden cancelada', orden: ordenCancelada });
  } catch (error) {
    console.error('Error al cancelar orden:', error);
    res.status(500).json({ error: 'Error al cancelar orden' });
  }
};

// Cerrar orden de trabajos
export const cerrarOrden = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const orden = await prisma.ordenTrabajo.findUnique({
      where: { id },
      include: {
        avion: {
          include: {
            ComponenteAvion: true,
            propietarios: true,
          },
        },
        componente: {
          include: { propietario: true },
        },
      },
    });

    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    // Si ya tiene snapshot, solo actualizamos estado + fecha de cierre
    if (orden.datosAvionSnapshot || orden.datosComponenteSnapshot) {
      const actualizada = await prisma.ordenTrabajo.update({
        where: { id },
        data: {
          estadoOrden: 'CERRADA',
          fechaCierre: new Date(),
        },
      });
      return res.json(actualizada);
    }

    let datosAvionSnapshot = null;
    let datosComponenteSnapshot = null;
    let datosPropietarioSnapshot = null;

    if (orden.avion) {
      const avion = orden.avion;
      datosAvionSnapshot = {
        id: avion.id,
        matricula: avion.matricula,
        marca: avion.marca,
        modelo: avion.modelo,
        numeroSerie: avion.numeroSerie,
        TSN: avion.TSN,
        vencimientoMatricula: avion.vencimientoMatricula,
        vencimientoSeguro: avion.vencimientoSeguro,
        certificadoMatricula: avion.certificadoMatricula,
        componentes: avion.ComponenteAvion.map(comp => ({
          tipo: comp.tipo,
          marca: comp.marca,
          modelo: comp.modelo,
          numeroSerie: comp.numeroSerie,
          TSN: comp.TSN,
          TSO: comp.TSO,
          TBOHoras: comp.TBOHoras,
          TBOFecha: comp.TBOFecha,
        })),
        propietarios: avion.propietarios.map(p => ({
          tipo: p.tipo,
          nombre: p.nombre,
          apellido: p.apellido,
          razonSocial: p.razonSocial,
          rut: p.rut,
          cedula: p.cedula,
          email: p.email,
          telefono: p.telefono,
        })),
      };

      if (avion.propietarios.length === 1) {
        const p = avion.propietarios[0];
        datosPropietarioSnapshot = {
          tipo: p.tipo,
          nombre: p.nombre,
          apellido: p.apellido,
          razonSocial: p.razonSocial,
          rut: p.rut,
          cedula: p.cedula,
          email: p.email,
          telefono: p.telefono,
        };
      }
    }

    if (orden.componente) {
      const comp = orden.componente;
      datosComponenteSnapshot = {
        tipo: comp.tipo,
        marca: comp.marca,
        modelo: comp.modelo,
        numeroSerie: comp.numeroSerie,
        TSN: comp.TSN,
        TSO: comp.TSO,
        TBOHoras: comp.TBOHoras,
        TBOFecha: comp.TBOFecha,
        archivo8130: comp.archivo8130,
      };

      if (comp.propietario) {
        const p = comp.propietario;
        datosPropietarioSnapshot = {
          tipo: p.tipo,
          nombre: p.nombre,
          apellido: p.apellido,
          razonSocial: p.razonSocial,
          rut: p.rut,
          cedula: p.cedula,
          email: p.email,
          telefono: p.telefono,
        };
      }
    }

    const ordenCerrada = await prisma.ordenTrabajo.update({
      where: { id },
      data: {
        estadoOrden: 'CERRADA',
        fechaCierre: new Date(),
        datosAvionSnapshot,
        datosComponenteSnapshot,
        datosPropietarioSnapshot,
      },
    });

    res.json(ordenCerrada);
  } catch (error) {
    console.error('❌ Error al cerrar orden:', error);
    res.status(500).json({ error: 'Error al cerrar orden' });
  }
};

// Helper global para dibujar la línea divisoria en el PDF
export function drawLine(doc) {
  doc
    .moveTo(doc.x, doc.y + 2)
    .lineTo(550, doc.y + 2)
    .strokeColor('#e5e7eb')
    .stroke()
    .fillColor('#000')
    .moveDown(0.6);
}

export const eliminarRegistroTrabajo = async (req, res) => {
  const id = Number(req.params.registroId);
  try {
    await prisma.registroDeTrabajo.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    console.error('❌ Error eliminando registro:', e);
    res.status(500).json({ error: 'Error eliminando registro' });
  }
};
