import { ModalProvider } from '../../Modal.jsx'
import { renderBlocks } from '../../blocks/index.jsx'

/* Layout "coringa": embute qualquer bloco do motor de relatórios (tabela,
   kpi-grid, gauge, funil, kanban, calendário, timeline, etc.) dentro de um
   slide, dando paridade total com o catálogo de componentes de Relatórios
   sem precisar de um layout dedicado para cada tipo. */
export default function BlocksSlide({ content, themeStyle, chartStyleIndex }) {
  const blocks = content.blocks ?? []

  return (
    <div className="slide-layout slide-blocks-layout" style={themeStyle}>
      {content.title && <h2 className="slide-heading">{content.title}</h2>}
      <ModalProvider renderBlocks={(b) => renderBlocks(b, chartStyleIndex, 'slide-modal')}>
        <div className="slide-blocks-body">
          {renderBlocks(blocks, chartStyleIndex, 'slide')}
        </div>
      </ModalProvider>
    </div>
  )
}
