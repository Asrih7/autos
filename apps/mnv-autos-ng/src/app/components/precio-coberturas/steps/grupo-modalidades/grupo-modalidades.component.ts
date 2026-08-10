import { Component, computed, effect, input, output, signal, Signal, WritableSignal } from "@angular/core";
import { CurrencyPipe, UpperCasePipe, registerLocaleData } from "@angular/common";
import localeEs from '@angular/common/locales/es';
import { BalButton, BalButtonGroup, BalCard, BalCardContent, BalCheckbox, BalCheckboxGroup, BalIcon, BalList, BalListItem, BalListItemAccordionBody, BalListItemAccordionHead, BalListItemContent, BalListItemIcon, BalListItemTitle, BalRadio, BalRadioGroup } from "@baloise/ds-angular";
import { TranslateModule } from "@ngx-translate/core";
import { Cobertura, Modalidad, ModalidadEditable } from "../../models/modalidades.models";
import { EstadoEdicionGrupo, RecalcularModalidadEvent } from "../../models/precio-coberturas-state.model";

registerLocaleData(localeEs);

@Component({
    selector: "app-grupo-modalidades",
    standalone: true,
    imports: [
        CurrencyPipe,
        UpperCasePipe,
        BalButton,
        BalButtonGroup,
        BalCard,
        BalCardContent,
        BalCheckbox,
        BalCheckboxGroup,
        BalIcon,
        BalList,
        BalListItem,
        BalListItemAccordionBody,
        BalListItemAccordionHead,
        BalListItemContent,
        BalListItemIcon,
        BalListItemTitle,
        BalRadio,
        BalRadioGroup,
        TranslateModule
    ],
    templateUrl: "./grupo-modalidades.component.html",
    styleUrls: ["./grupo-modalidades.component.scss"],
})
export class GrupoModalidadesComponent {
    readonly titulo = input.required<string>();
    readonly codigo = input.required<string>();
    readonly modalidades = input.required<Modalidad[]>();
    readonly recalcularModalidad = output<RecalcularModalidadEvent>();

    readonly baseLangKey = "precioCoberturas.grupoModalidades";

    private static readonly TODO_RIESGO_CODE = "TODO_RIESGO";
    readonly esTodoRiesgo: Signal<boolean> = computed(() => this.codigo() === GrupoModalidadesComponent.TODO_RIESGO_CODE);

    readonly grupoModalidades: Signal<Modalidad[]> = computed(() => {
        if (this.esTodoRiesgo()) {
            return this.agruparTodoRiesgo(this.modalidades())
        }

        return this.modalidades();
    });

    readonly estadoEdicion: WritableSignal<Record<string, ModalidadEditable>> = signal({});

    /**
     * Inicializa el estado editable del componente a partir de las modalidades visibles.
     */
    constructor() {
        effect(() => {
            const listaModalidades = this.grupoModalidades();

            this.estadoEdicion.set(
                this.crearEstadoInicial(listaModalidades)
            );
        });
    }

    /**
     * Crea el estado editable inicial para las modalidades visibles del grupo.
     *
     * @param modalidades Listado de modalidades visibles del grupo.
     * @returns Estado editable inicial indexado por código de modalidad visible.
     */
    private crearEstadoInicial(modalidades: Modalidad[]): EstadoEdicionGrupo {
        return modalidades.reduce<EstadoEdicionGrupo>((acc, modalidad) => {
            acc[modalidad.codigo] = {
                codigoModalidad: modalidad.codigo,
                franquiciaSeleccionada: modalidad.franquicia,
                coberturas: modalidad.coberturasOpcionales.map(cobertura => ({
                    codigo: cobertura.codigo,
                    contratada: !!cobertura.contratada
                }))
            };

            return acc;
        }, {});
    }

    /**
     * Agrupa las modalidades de todo riesgo para simplificar su presentación en la UI.
     *
     * La modalidad visible con franquicia será la marcada como `seleccionada`.
     * Si ninguna modalidad está marcada, se usará por defecto la primera modalidad
     * con franquicia recibida desde el backend o desde sesión.
     *
     * @param modalidades Listado de modalidades pertenecientes al grupo de todo riesgo.
     * @returns Listado transformado de modalidades visibles para el grupo todo riesgo.
     */
    agruparTodoRiesgo(modalidades: Modalidad[]): Modalidad[] {
        const grupoTodoRiesgo: Modalidad[] = [];

        const conFranquicia = modalidades.filter(
            modalidad => modalidad.franquicia !== null && modalidad.franquicia !== 0
        );
        const sinFranquicia = modalidades.find(
            modalidad => modalidad.franquicia === 0
        );

        if (conFranquicia.length) {
            const modalidadReferencia =
                conFranquicia.find(modalidad => modalidad.seleccionada) ??
                conFranquicia[0];

            grupoTodoRiesgo.push({
                ...modalidadReferencia,
                modalidadesFranquicia: conFranquicia
            });
        }
        if (sinFranquicia) {
            grupoTodoRiesgo.push({
                ...sinFranquicia,
                modalidadesFranquicia: [sinFranquicia]
            });
        }

        return grupoTodoRiesgo;
    }

    /**
     * Actualiza el estado editable de una cobertura opcional para una modalidad.
     *
     * Modifica la propiedad `contratada` de la cobertura seleccionada
     * dentro del estado local de edición de la modalidad.
     *
     * @param modalidad Modalidad sobre la que se modifica la cobertura opcional.
     * @param cobertura Cobertura opcional seleccionada o deseleccionada.
     * @param event Evento emitido por el componente de checkbox con el nuevo estado.
     */
    seleccionCobertura(modalidad: Modalidad, cobertura: Cobertura, event: CustomEvent): void {
        const checked = !!event.detail;

        this.estadoEdicion.update(state => {
            const editable = state[modalidad.codigo];

            return {
                ...state,
                [modalidad.codigo]: {
                    ...editable,
                    coberturas: editable.coberturas.map(c =>
                        c.codigo === cobertura.codigo
                            ? {
                                ...c,
                                contratada: checked
                            } : c
                    )
                }
            };
        });
    }

    /**
     * Actualiza la franquicia seleccionada para una modalidad de todo riesgo.
     *
     * Convierte el valor recibido a número y lo persiste
     * dentro del estado local de edición asociado a la modalidad visible.
     *
     * @param modalidad Modalidad visible sobre la que se modifica la franquicia.
     * @param event Evento emitido por el grupo de radio con la franquicia seleccionada.
     */
    seleccionFranquicia(modalidad: Modalidad, event: CustomEvent): void {
        const franquiciaSeleccionada = Number(event.detail);

        this.estadoEdicion.update(state => {
            const editable = state[modalidad.codigo]

            return {
                ...state,
                [modalidad.codigo]: {
                    ...editable,
                    franquiciaSeleccionada
                }
            }
        });
    }

    /**
     * Indica si una cobertura opcional está contratada dentro del estado editable.
     *
     * Este método permite que el template dependa del estado real de edición y no del
     * valor original recibido dentro de la modalidad.
     *
     * @param codigoModalidad Código de la modalidad visible.
     * @param codigoCobertura Código de la cobertura opcional.
     * @returns `true` si la cobertura está seleccionada; en caso contrario, `false`.
     */
    isCoberturaContratada(codigoModalidad: string, codigoCobertura: string): boolean {
        return this.estadoEdicion()[codigoModalidad]?.coberturas.some(
            cobertura =>
                cobertura.codigo === codigoCobertura && cobertura.contratada
        ) ?? false;
    }

    /**
     * Obtiene la franquicia seleccionada para una modalidad visible.
     *
     * @param codigoModalidad Código de la modalidad visible.
     * @returns Franquicia seleccionada o `null` si no existe selección.
     */
    getFranquiciaSeleccionada(codigoModalidad: string): number | null {
        return this.estadoEdicion()[codigoModalidad]?.franquiciaSeleccionada ?? null;
    }

    /**
     * Construye la modalidad actualizada y dispara el flujo de recalculo de precio.
     * 
     * @param modalidad Modalidad base desde la cual se construye la versión actualizada.
     */
    recalcularPrecio(modalidad: Modalidad): void {
        const modalidadActualizada = this.construirModalidadActualizada(modalidad);

        this.recalcularModalidad.emit({
            codigoGrupo: this.codigo(),
            modalidadVisible: modalidad,
            modalidadActualizada,
        });
    }

    /**
     * Construye una nueva modalidad combinando la modalidad real seleccionada con el estado editable.
     *
     * Para modalidades con variantes de franquicia, primero obtiene la modalidad real
     * correspondiente a la franquicia seleccionada. Luego aplica sobre esa modalidad
     * las coberturas opcionales modificadas en la tarjeta visible.
     *
     * @param modalidad Modalidad visible utilizada como base para resolver la selección actual.
     * @returns Nueva modalidad real seleccionada con franquicia y coberturas actualizadas.
     */
    private construirModalidadActualizada(modalidad: Modalidad): Modalidad {
        const modalidadReal = this.obtenerModalidadSeleccionada(modalidad);
        const estado = this.estadoEdicion()[modalidad.codigo];

        if (!estado) {
            return modalidadReal;
        }

        return {
            ...modalidadReal,
            seleccionada: true,
            franquicia: estado.franquiciaSeleccionada,
            coberturasOpcionales: modalidadReal.coberturasOpcionales.map(
                cobertura => ({
                    ...cobertura,
                    contratada:
                        estado.coberturas.find(c => c.codigo === cobertura.codigo)
                            ?.contratada ?? false
                })
            )
        };
    }

    /**
     * Obtiene la modalidad real asociada a la franquicia seleccionada.
     *
     * Si la modalidad no contiene variantes de franquicia, devuelve la modalidad recibida.
     * En caso contrario, busca dentro de `modalidadesFranquicia` aquella cuya franquicia
     * coincide con la franquicia seleccionada en el estado editable.
     *
     * @param modalidad Modalidad visible desde la cual se resuelve la modalidad real.
     * @returns Modalidad real seleccionada o, si no existe coincidencia, la modalidad original.
     */
    private obtenerModalidadSeleccionada(modalidad: Modalidad): Modalidad {
        const franquiciaSeleccionada = this.estadoEdicion()[modalidad.codigo]?.franquiciaSeleccionada;

        if (!modalidad.modalidadesFranquicia?.length) {
            return modalidad;
        }

        const modalidadReal = modalidad.modalidadesFranquicia.find(
            m => m.franquicia === franquiciaSeleccionada
        );

        return modalidadReal ?? modalidad;
    }

    seleccionModalidad(modalidad: Modalidad): void {
        modalidad.derogacion
            ? this.solicitar(modalidad)
            : this.contratar(modalidad)
    }

    contratar(modalidad: Modalidad): void {
        console.log('== Contratar => ', modalidad);
        // sólo debe emitir un evento con el código de la modalidad
    }

    solicitar(modalidad: Modalidad): void {
        console.log('== Solicitar => ', modalidad);
        // sólo debe emitir un evento con el código de la modalidad

        // Por el momento y para persistir la información, llamamos al flujo de recalculo de precio.
        this.recalcularPrecio(modalidad);
    }
}
