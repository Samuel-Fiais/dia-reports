import Inspector from './Inspector.jsx'
import OutlineTree from './OutlineTree.jsx'
import PreviewPane from './PreviewPane.jsx'

export default function EditorLayout(props) {
  return <div className="visual-editor-layout"><OutlineTree state={props.state} dispatch={props.dispatch} /><PreviewPane report={props.state.report} selection={props.state.selection} onSelect={(selection) => props.dispatch({ type: 'select', selection })} /><Inspector {...props} /></div>
}
