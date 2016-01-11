import {Block, Textblock, Paragraph, Text, Fragment, Attribute, Pos} from "../../../../git/prosemirror/dist/model"
import {elt, insertCSS} from "../../../../git/prosemirror/dist/dom"
import {defParser, defParamsClick, andScroll, namePattern} from "../utils"

export class Choice extends Textblock {
	static get kinds() { return "choice" }
	get attrs() {
		return {
			name: new Attribute(),
			value: new Attribute(),
			class: new Attribute({default: "widgets-choice"})
		}
	}
	create(attrs, content, marks) {
		let children = [this.schema.node("radiobutton",attrs)]
		if (content) children.push(content)
		return super.create(attrs,children,marks)
	}
}
 
export class MultipleChoice extends Block {
	static get contains() { return "choice"}
	get isList() { return true }
	get attrs() {
		return {
			name: new Attribute,
			title: new Attribute,
			class: new Attribute({default: "widgets-multiplechoice"})
		}
	}
}

defParser(Choice,"div","widgets-choice")
defParser(MultipleChoice,"div","widgets-multiplechoice")

Choice.prototype.serializeDOM = (node,s) => s.renderAs(node,"div",node.attrs)

MultipleChoice.prototype.serializeDOM = (node,s) => s.renderAs(node,"div",node.attrs)

Choice.register("command", {
  name: "splitChoice",
  label: "Split the current choice",
  run(pm) {
    let {from, to, node} = pm.selection
    if ((node && node.isBlock) ||
        from.path.length < 2 || !Pos.samePath(from.path, to.path)) return false
    let toParent = from.shorten(), mc = pm.doc.path(toParent.path)
   return pm.tr.delete(from, to).split(from, 1, this, {name: mc.attrs.name, value: mc.size}).apply(andScroll)
  },
  keys: ["Enter(19)"]
})

Choice.register("command", {
  name: "deleteChoice",
  label: "delete this choice or multiplechoice",
  run(pm) {
    let {from, top} = pm.selection
	let chc = pm.doc.path(from.path)
    if (from.offset > 0) return false
	//return pm.tr.delete(cut,cut.move(1)).apply()
    // if top choice, delete whole question if only one choice
/*    if (mc.type.name == "choice") {
    	return pm.tr.delete(cut, cut.move(1)).apply()
    } else {
    	// don't delete question if more than one choice
    	if (mc.size == 1) {
     		return pm.tr.delete(cut,cut.move(1)).apply()
    	} else
    		return false;
    }
*/  },
  keys: ["Backspace(40)", "Mod-Backspace(40)"]
})

MultipleChoice.register("command",{
	name: "insertMultipleChoice",
	label: "MultipleChoice",
	run(pm, name, title) {
    	let {node, from, to} = pm.selection
    	let mc = this.create({name, title}, node? node.content: pm.schema.node("choice",{name, value: 0}))
   		let tr = pm.tr.replaceSelection(mc).apply(andScroll)
   		// need to move to newly added node
  		return tr
	},
	select(pm) {
		return pm.doc.path(pm.selection.from.path).type.canContainType(this)
	},
	params: [
	 	{ name: "Name", label: "Short ID name", type: "text", default: "test", options: {pattern: namePattern, size: 10}},
	 	{ name: "Title", label: "Description", type: "text", default:"Test Title"}
	],
    prefillParams(pm) {
	    let {node} = pm.selection
	    if (node && node.type == this)
	      return [node.attrs.name, node.attrs.title]
	 }
})

defParamsClick(MultipleChoice,"schema:multiplechoice:insertMultipleChoice")

insertCSS(`

.widgets-choice input {
	float: left;
}

div.widgets-choice:first-child > input {
	display: none;
}

/*.widgets-choice:nth-child(n+1) span {
	left: 20px;
}*/

.widgets-multiplechoice:before {
	content: attr(title);
	color: black;
	font-size: 14px;
	font-weight: bold;
}

.ProseMirror .widgets-choice:hover {
	cursor: text;
}

.ProseMirror .widgets-multiplechoice:hover {
	cursor: pointer;
}
`)