let get          = document.querySelector.bind(document),
	getAll       = document.querySelectorAll.bind(document), // * binding due to loss of context

	fromTemplate = template => document.importNode(template.content.firstElementChild, true);
	
Node.prototype.get     = function (selector) { return this.querySelector(selector)    };
Node.prototype.getAll  = function (selector) { return this.querySelectorAll(selector) };

Node.prototype.parents = function () {

	let element = this,
	
		parents = [];

	while ((element = element.parentElement) !== document.body) parents = [...parents, element];

	return parents;

};

String.prototype.belongsTo = function (array) { return array.includes(this.valueOf()); }

Array.compare = function (source, target) {

	if (source.length != target.length) return false;

	let length = source.length;

    for (var i = 0; i < length; i++) {
		
		if (source[i] != target[i]) return false;
		    
	};
	  
	return true;
	
};

Object.defineProperty(Array.prototype, 'first', {

	get () { return this[0] },

	set (value) { this.unshift(value) }

});

Object.defineProperty(Array.prototype, 'last', {

	get () { return this[this.length - 1] },

	set (value) { this[this.length] = value }
	
});

let getCaretPosition = function () {

	let range = getSelection().getRangeAt(0);

	return range.getBoundingClientRect().x;

};

let getNodePosition = function () {

	let rect = Grid.current.node.getBoundingClientRect();

	return rect.top + (rect.height / 2);

};

// # KEYS

	// ## DIRECTIONS

let UP         = "up",
	DOWN       = "down",

	LEFT       = "left",
	RIGHT      = "right",

	// ## ARROWS

	ARROW      = "arrow",

	ARROWUP    = ARROW + UP,
	ARROWDOWN  = ARROW + DOWN,
	ARROWLEFT  = ARROW + LEFT,
	ARROWRIGHT = ARROW + RIGHT,

	// ## POSITION

	BEFORE     = "before",
	AFTER      = "after",

	ABOVE      = "above",

	INDENT     = "indent",
	OUTDENT    = "outdent",

	ALL        = "all",

	// ## STATE

	EDITABLE   = true,
	READONLY   = false,

	FOLD       = "fold",
	UNFOLD     = "unfold",

	// ## MODIFIER KEYS

	MOD        = "mod+",       // * combining tag for `"ctrl" || "command"`
	ALT        = "alt+",
	SHIFT      = "shift+",

	// ## FUNCTION KEYS

	F2         = "f2",
	F3         = "f3",

	ENTER      = "enter",
	ESCAPE     = "escape",
	DELETE     = "delete",
	BACKSPACE  = "backspace",

	TAB        = "tab",

	// ## EVENT CODES & SHORTCUTS

	CLICK      = "click",
	CHANGE     = "change",
	KEYPRESS   = "keypress",
	KEYDOWN    = "keydown",
	WHEEL      = "wheel",

	COPY       = "copy",
	PASTE      = "paste",
	CUT        = "cut",

	CREATE     = "create",
	ADD        = "add",
	REMOVE     = "remove",
	EDIT       = "edit",
	SAVE       = "save",
	CANCEL     = "cancel",
	BISECT     = "bisect",
	COMMIT     = "commit",
	SELECT     = "select",

	VIEW       = "view",
	FILTERING  = "filtering",

	OPEN       = "open",
	CLOSE      = "close",
	MOVE       = "move",

	COLUMN     = "column",

	// ## ELEMENT SHORTCUTS

	LABEL      = "label",
	CHECKBOX   = "[type='checkbox']",

	CONTENT    = ".content",
	CHILDREN   = ".children",
	NODE       = ".node",
	
	COL        = ".column",
	BACKDROP   = ".backdrop";
	

/* from https://github.com/component/range-closest-to-xy */
/* modified to suit the project */

/**
 * Returns the distance between a point and a ClientRect
 * 
 * @param {ClientRect} rect
 * @param {Number}     x
 * @param {Number}     y
 * @returns {Number}
 * @api private 
 */

function distanceToRect (rect, x, y) {

	// * calculate closest internal point contained by `rect`
	let ix = x,
		iy = y;

	if (ix <  rect.left)   ix = rect.left;
	if (ix >= rect.right)  ix = rect.right;
	if (iy <  rect.top)    iy = rect.top;
	if (iy >= rect.bottom) iy = rect.bottom;

	// * calculate distance
	let dx = x - ix,
		dy = y - iy;

	return Math.sqrt(dx * dx + dy * dy);

}
  
  /**
   * Test the client rects of all characters in a text node, and updates the
   * object given in the `result` parameter with the range containing the 
   * character closest to the given coordinates. (`result` is only updated
   * if the new match is closest than the one passed in)
   *
   * @param {Node}     node
   * @param {Number}   x
   * @param {Number}   y
   * @param {Function} filter function
   * @param {Object}   result
   */
  
  function testRects (node, x, y, fn, result) {

	let length = node.textContent.length;

	while (length--) {

		let range = document.createRange();

		range.setStart(node, length);
		range.setEnd(node,   length + 1);

		let rect = range.getBoundingClientRect();

		if (fn(range, rect)) {

			var distance = distanceToRect(rect, x, y);

			if (distance < result.distance) {

				result.distance = distance;
				result.range    = range;

			};

		};

	};

  };
  
  /**
   * Returns the closest range selecting a text character given an 
   * HTML element, and X and Y coordinates
   * 
   * @param {HTMLElement} el
   * @param {Number}      x
   * @param {Number}      y
   * @param {Function}    an optional function returning bool to conditionally filter only certain ranges.
   * @api public
   */
  
  function getRangeFromPoint (el, x, y, fn) {

	if (!fn) fn = function () { return true };

	let result = {
		
		range: null, 
		distance: Infinity 
	
	},
		
		it = document.createNodeIterator(el, NodeFilter.SHOW_TEXT, null, false),
		
		node;

	while (node = it.nextNode()) testRects(node, x, y, fn, result);

	return result.range;

}

let _supportsHasSelector = CSS.supports(":has(*)");

let Grid = {

	// # DEFAULT BOARD SETTINGS

	_reservedID: 11, // TODO: change after writing tutorial snapshot


	// # ELEMENT GETTERS

	window:   get("main"),
	footer:   get("footer"),
	backdrop: get(".backdrop"),

	current: {

		// # INTRA-NODE

		get node () { return get("[data-current]") },
		set node (element) {

			Grid.current.node && delete Grid.current.node.dataset.current;

			element.dataset.current = "";

		},

		get content   () { return Grid.current.node.get(CONTENT) },
		get text      () { return Grid.current.content.textContent },

		// # EXTRA-NODE

		get checkbox  () {
			
			let checkbox = Grid.current.node.get(CHECKBOX);
			
			if (Grid.current.children.contains(checkbox)) return false;

			return checkbox;

		},

		get siblings () {

			let nodes = Grid.nodes,
				index = nodes.indexOf(Grid.current.node),

				siblings = {

					previous: nodes[index - 1], 
					next:     nodes[index + 1]

				};

			return siblings;

		},

		// # CONTAINERS

		get children  () { return Grid.current.node.get(CHILDREN) },

		get container () { return Grid.current.node.closest(CHILDREN) },
		get elder     () { return Grid.current.container.closest(NODE) },

		// # GRID ELEMENTS

		get column    () { return Grid.current.node.closest(COL) },

		get root      () { return Grid.current.column.get(NODE + ":first-of-type") }

	},

	get nodes () { return [...Grid.current.column.getAll(NODE)].filter(node => !Grid.is.hidden(node)) },

	next: {

		get node () {

			let nodes = Grid.nodes,
				index = nodes.indexOf(Grid.current.node);
			
			return nodes[index + 1];
		
		},

		sibling (target) { return target.nextElementSibling }

	},

	previous: {

		get node () {

			let nodes = Grid.nodes,
				index = nodes.indexOf(Grid.current.node);
			
			return nodes[index - 1];
		
		},

		sibling (target) { return target.previousElementSibling }

	},


	// # NODE COMPARATORS
	
	is: {

		empty     (element) { return !element.textContent.trim().length },

		hidden    (element) { return element.offsetParent === null },

		expanded  (element) { return Grid.has.children(element) && !element.get(CHECKBOX).checked }

	},

	has: {

		children (element) { return element.get(CHILDREN).children.length }

	},


	// # HTML STRUCTURE HANDLERS

	_templates: {

		node:   get("#node"),

		column: get("#column")

	},

	render: {

		column () {

			let column = fromTemplate(Grid._templates.column);
			
			return column;

		},

		node (source, id) {

			let node = fromTemplate(Grid._templates.node);

			if (source) {

				// *   `typeof source == Object || Node`
				// * → `source.content || source.textContent`

				node.get(CONTENT).textContent = source.content || source.textContent;

				Nodes._giveID(node, id);

			}

			return node;

		}

	},

	initialize () {

		let column  = Grid.render.column(),

			image   = ActionHistory.image.state,

			current = null,

			produce = function (node, parent) {

				let element = Grid.render.node(node, node.id.toString()),
					
					host    = parent || column;

				host.get(CHILDREN) ? host.get(CHILDREN).append(element) : host.append(element);
				if (!_supportsHasSelector && host != column) host.dataset.hasChildren = "";
				if (node.folded) element.get(CHECKBOX).checked = true;
				if (node.current) current = element;

				// * if there are no children, function returns and cycle continues
				for (child of node.children) produce(child, element);
				
			};

		for (node of image) produce(node);

		let root = column.get(NODE + ":first-of-type");

		root.get(LABEL).remove();
		root.get(CHECKBOX).remove();

		column.append(root);

		Grid.window.get(".columns").append(column);

		Grid.current.node = current || root;

	}

};

let Mode = {

	previous: null,

	get current      () { return Grid.window.dataset.mode },
	set current (value) {

		if (Mode.current == Mode.previous) return;
			
		Mode.previous = Mode.current;
		
		Grid.window.dataset.mode = value;
	
	},

	is   (query) { return Mode.current === query },

	reset     () { Mode.current = Mode.previous },

	view      () { Mode.current = VIEW         },
	edit      () { Mode.current = EDIT         },
	filtering () { Mode.current = FILTERING    }

};

let Nodes = {

	_previousFocus: null,

	_resetFocus () { Nodes._previousFocus = null },

	_toggleParentStatus (target) {
		
		if (_supportsHasSelector) return;

		if (target == Grid.current.root) return;

		if (Grid.is.empty(target.get(CHILDREN))) {
			
			delete target.dataset.hasChildren;

			target.get(CHECKBOX).checked = false;
		
		} else {
			
			target.dataset.hasChildren = "";
		
		};
	
	},

	_commit () {

		if (Grid.current.node.dataset && Grid.current.node.dataset.nodeId) return;

		let previous = Grid.previous.sibling(Grid.current.node);
			
			Nodes._giveID(Grid.current.node);

			return {

				node: Grid.current.node.dataset.nodeId,
				parent: Grid.current.elder.dataset.nodeId,
				previous: previous && previous.dataset.nodeId

			};
		
	},

	create (above) {

		if (Mode.current == EDIT) {

			Nodes.Editing.save();

			if (Grid.is.empty(Grid.current.content)) return;

		};

		let node    = Grid.render.node(),
			target  = Grid.current.node;

		if (above && Grid.current.node != Grid.current.root) {

			target.before(node);

		} else if (Grid.current.node == Grid.current.root || Grid.is.expanded(Grid.current.node)) {

			target.get(CHILDREN).prepend(node);

		} else {

			target.after(node);

		};

		Nodes._previousFocus = Grid.current.node;
		Grid.current.node    = node;

		Nodes.Editing.start();

		return {

			parent: Grid.current.elder.dataset.nodeId,
			previous: Grid.previous.sibling(target) && Grid.previous.sibling(target).dataset.nodeId

		};

	},

	remove () {

		if (Grid.current.node == Grid.current.root) return;

		let { previous, next } = Grid.current.siblings,
			  target = Nodes._previousFocus || next || previous;

			  Grid.current.node.remove();

		Grid.current.node = target;
		Nodes._resetFocus();

		Nodes._toggleParentStatus(Grid.current.node);

		return {

			node: Grid.current.node.dataset.nodeId, 
			parent: Grid.current.elder.dataset.nodeId, 
			previous: previous && previous.dataset.nodeId

		}

	},

	bisect () {

		if (!Mode.current == EDIT) return;

		let selection = getSelection(),
			range     = selection.getRangeAt(0),
			
			anchor    = selection.anchorNode,
			length    = anchor.length;
			
		range.setEnd(anchor, length); // * extend internal selection from caret to end of string
		
		let bisected = range.extractContents();

		Nodes.Editing.save();
		
		Nodes.create();

		Nodes.Editing.start();

		Grid.current.content.append(bisected);

		return {

			node: Grid.current.node.dataset.nodeId

		};

	},

	fold (state) {

		if (!Grid.current.checkbox) return;

		if (!Grid.has.children(Grid.current.node)) return;

		Grid.current.checkbox.checked = state == FOLD ? true : false;
		
		return {

			type: state,
			node: Grid.current.node.dataset.nodeId

		}

	},	

	move (position) {

		// * Indigrid moves nodes similar to `target.{before||after}(node)`

		let wrapper = Grid.current.node,

			cliff   = position == BEFORE 
						? ":first-child" 
						: ":last-child";

		if (Grid.current.elder.contains(Grid.current.root) && wrapper.matches(cliff)) return;

		let elder   = Grid.current.elder,
		
			sibling = position == BEFORE 
						? Grid.previous.sibling(wrapper) 
						: Grid.next.sibling(wrapper),
			
			target = sibling;

		if (!sibling) {

			// * ommer, n.: (gender-neutral) parent's sibling
			let ommer = position == BEFORE 
							? Grid.previous.sibling(elder) 
							: Grid.next.sibling(elder),

				// * the opposite of a cliff
				hill = position == BEFORE ? ":last-child" : ":first-child",

				fertile = ommer && Grid.is.expanded(ommer);

			// * open parents ? between open parents : to the level above
			target = fertile ? ommer.get(`.children > ${hill}`) : elder;

			// * invert `position` → insert moved node after last child and before first child
			position = fertile && hill == ":last-child" ? AFTER : BEFORE;

		};

		let data =  {

			node: wrapper.dataset.nodeId,
			parent: elder.dataset.nodeId, 
			previous: Grid.previous.sibling(wrapper) && Grid.previous.sibling(wrapper).dataset.nodeId

		};

		target[position](wrapper);

		Nodes._toggleParentStatus(elder);

		return data;

	},

	dent (state) {

		if (Grid.current.node == Grid.current.root) return;

		let data;

		let handler = {

			[INDENT] () {

				if (Grid.current.node.matches(":first-child")) return;

				let parent = Grid.previous.sibling(Grid.current.node);

				parent.get(CHILDREN).append(Grid.current.node);

				Nodes._toggleParentStatus(parent);

				data = {

					node: Grid.current.node.dataset.nodeId, 
					parent: Grid.current.elder.dataset.nodeId

				}

			},

			[OUTDENT] () {

				// * ↓ if parent == heading
				if (Grid.current.elder == Grid.current.root) return;

				let parent = Grid.current.elder;

				parent.after(Grid.current.node);

				Nodes._toggleParentStatus(parent);

				data = {

					node: Grid.current.node.dataset.nodeId, 
					parent: Grid.current.elder.dataset.nodeId

				}

			}

		};

		handler[state]();

		if (Mode.current == EDIT) Grid.current.content.focus(); // * refocus `.content` when moving

		return data;

	},

	Editing: {

		Cache: {

			rect:    null,
			content: null,

			store () {

				Nodes.Editing.Cache.content = Grid.current.text;
				Nodes.Editing.Cache.rect    = Grid.current.content.getBoundingClientRect();

			},

			restore () {

				Grid.current.content.textContent = Nodes.Editing.Cache.content;

				Nodes.Editing.Cache.content = Nodes.Editing.Cache.rect = null;

			}

		},

		start (event) {

			if (Mode.current == EDIT) return;

			Mode.edit();

			Nodes.Editing._setContentState(EDITABLE);

			Nodes.Editing.Cache.store();

			Grid.current.content.focus(); // * DOM focus / important for caret placement

			// * `event` == CLICK → if entered editing via clicking...
			event ? Nodes.Editing._placeCaretToPoint(event) : Nodes.Editing._placeCaretToEnd();

			return {

				node: Grid.current.node.dataset.nodeId

			};

		},

		save () {

			Nodes.Editing._finish();

			Nodes.Editing._removeEmpty();

			ActionHistory.execute(COMMIT); // * handles action history change

		},

		cancel () {

			Nodes.Editing._finish();

			Nodes.Editing.Cache.restore();

			Nodes.Editing._removeEmpty();

			return {

				node: Grid.current.node.dataset.nodeId,
				parent: Grid.current.elder.dataset.nodeId,
				previous: Grid.previous.sibling(Grid.current.node) && Grid.previous.sibling(Grid.current.node).dataset.nodeId

			}

		},

		_finish () {

			Mode.reset();

			Grid.current.content.textContent = Grid.current.text.trim();

			Nodes.Editing._setContentState(READONLY);

		},

		_removeEmpty () {
			
			Grid.is.empty(Grid.current.content) && Nodes.remove();

		},

		_setContentState (state) { return Grid.current.content.contentEditable = state },

		_placeCaretToEnd () {

			let selection = getSelection();

			selection.selectAllChildren(Grid.current.content);
			selection.collapseToEnd();

		},

		_placeCaretToPoint (event) {

			let selection = getSelection(),

				anchor    = selection.anchorNode, // * text content of `.content`

				range     = getRangeFromPoint(anchor, event.x, event.y),
				offset    = range.endOffset; // * point within text to which to collapse the caret to

			selection.addRange(range); // * "activates" the range by including it into the selection's "memory"

			selection.collapse(anchor, offset);

		}

	},

	_giveID (target, id) {

		let ID = id ? id : Grid._reservedID++;

		target.dataset.nodeId  = ID;

		target.get(CHECKBOX).id = ID;
		target.get(LABEL).setAttribute("for", ID);
	
	},

	_clearFocus (label) {

		if (label.parentElement == Grid.current.elder) Grid.current.node = Grid.current.elder;
	
	}

};

let ActionHistory = {

	image: {

		default: [

			{ id: "null", folded: false, content: "Root", children: [

				{ id: 0, folded: false, content: "Hello!", children: [] },

				{ id: 1, folded: false, content: "This is Intergrid, an online outliner and note-taking app", children: [] },

				{ id: 2, folded: false, content: "It's inspired by – and in many ways replicates – Indigrid, the original \"-grid\" app by Mark Nevarrik", children: [

					{ id: 3, folded: false, content: "If you're interested in a desktop outliner of the same format, check out Indigrid:", children: [] },
					
					{ id: 4, folded: false, content: "http://innovationdilation.com", children: [] },

					{ id: 5, folded: false, content: "(don't worry: you can easily copy your notes between Indigrid and Intergrid if you change your mind)", children: [] }

				] },

				{ id: 6, folded: false, content: "Intergrid is currently in the alpha state", children: [

					{ id: 7, folded: false, content: "There may be bugs, and most of the features are still missing", children: [] },

					{ id: 8, folded: false, content: "If you see a bug, please report it to this address:", children: [] },

					{ id: 9, folded: false, content: "firebrandcoding@gmail.com", children: [] }

				] },

				{ id: 10, folded: false, content: "Most of the controls are noted in the footer", children: [

					{ id: 11, folded: false, content: "If the hotkey says ⌘, it means Control / Ctrl (or Meta, if you're on Mac)", children: [] },

					{ id: 12, folded: false, content: "If it says ⇧, you have to hold Shift for it to work", children: [] }

				] },

				{ id: 13, folded: false, content: "Some hotkeys are only available in certain modes – like, editing", children: [] },

				{ id: 14, folded: true, content: "You can only see what's under this node if you navigate to it and expand it", children: [

					{ id: 15, folded: false, content: "Well done!", children: [] },

					{ id: 16, folded: true, content: "You can also fold nodes by pressing on the + / − icon next to them", children: [

						{ id: 17, folded: false, content: "The icon only appears if the node has \"children\"", children: [] }

					] }

				] },

				{ id: 18, folded: true, content: "Now, feel free to delete everything and start your own notes!", children: [

					{ id: 19, folded: false, content: "Don't worry: the root node can't be removed, so long-pressing Del is okay", children: [] }

				] }

			] }

		],

		// * session copy of image
		state: [],

		// * diff → merge with localStorage image
		maintain () {

			let root = Grid.current.column.get(NODE),
				collection = [],

				process = function (node, scope) {

					let checkbox = node.get(CHECKBOX);

					let item = {
						
						id: node.dataset.nodeId,
						folded: checkbox && checkbox.checked,
						current: node.matches("[data-current]"),
						content: node.get(CONTENT).textContent,
						children: []
					
					};

					let children = [...node.get(CHILDREN).children];

					for (child of children) process(child, item.children);

					let target = scope || collection;

					target.last = item;

				};

			process(root);

			ActionHistory.image.state = collection;
			
		},

		store () { localStorage.setItem("image", JSON.stringify(ActionHistory.image.state)) },

		load () {

			let state = JSON.parse(localStorage.getItem("image"));

			ActionHistory.image.state = state || ActionHistory.image.default;

		}

	},

	handler: {

		[CREATE]:         [Nodes.create],
		[CREATE + ABOVE]: [Nodes.create, ABOVE],

		[REMOVE]:         [Nodes.remove],

		[COMMIT]:         [Nodes._commit],


		[EDIT]:    [Nodes.Editing.start],
		[SAVE]:    [Nodes.Editing.save],
		[CANCEL]:  [Nodes.Editing.cancel],

		[BISECT]:  [Nodes.bisect],


		[MOVE + BEFORE]:  [Nodes.move, BEFORE],
		[MOVE + AFTER]:   [Nodes.move, AFTER],

		[INDENT]:         [Nodes.dent, INDENT],
		[OUTDENT]:        [Nodes.dent, OUTDENT],

		[FOLD]:           [Nodes.fold, FOLD],
		[UNFOLD]:         [Nodes.fold, UNFOLD]

	},

	execute (action) {

		// * takes first item of the array as `fn`, and the rest, if present, as `args`
		let [ fn, ...args ] = ActionHistory.handler[action],
			data            = fn(...args);

		if (!data) return;

		ActionHistory.process({ type: action, ...data });
	
	},

	process (data) {

		if (!data || !data.type) {

			console.error("ActionHistory.process(): incomplete data object supplied");
			console.error(data);

			return;
		
		};

		ActionHistory.image.maintain();


	}

};

let WorkflowHandler = {

	// # EVENTS

	[WHEEL] (event) {

		if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

		if (event.path.includes(Grid.footer)) {

			// * assuming there would always be a column to scroll at half the viewport height
			let elements = document.elementsFromPoint(event.x, window.innerHeight / 2),
	
				column   = elements.find(element => element.matches(".column"));

			column.scrollBy(0, event.deltaY);

		} else if (event.path.includes(Grid.backdrop)) {

			let elements = document.elementsFromPoint(event.x, event.y),

				column   = elements.find(element => element.matches(".column"));
			
			column.scrollBy(0, event.deltaY);

		};

		return;

	},

	// # KEYS

	[ESCAPE] () {

		if (Mode.current == EDIT) {

			Nodes.Editing.cancel();

		} else if (SelectionHandler.get().length) {

			// * Indigrid doesn't do this, but it seems appropriate

			SelectionHandler.clear();

		};
		
	},

	[ARROWUP] () {

		let editing = Mode.current == EDIT;

		if (editing) {

			let style         = getComputedStyle(Grid.current.content),
				caretPosition = TraversalHandler.vector.caret.y - Number.parseFloat(style.padding) - Number.parseFloat(style.borderWidth),
				boundry       = Nodes.Editing.Cache.rect.y;

			if (boundry - 1 < caretPosition && caretPosition < boundry + 1) {

				Nodes.Editing.save();
				
				TraversalHandler.traverse(UP);

				Nodes.Editing.start();

			};

			return;

		};

		TraversalHandler.traverse(UP);

	},

	[ARROWDOWN] () {

		let editing = Mode.current == EDIT;

		if (editing) {

			let style         = getComputedStyle(Grid.current.content),
				caretPosition = TraversalHandler.vector.caret.bottom + Number.parseFloat(style.padding) + Number.parseFloat(style.borderWidth),
				boundry       = Nodes.Editing.Cache.rect.y + Nodes.Editing.Cache.rect.height;

			if (boundry - 1 < caretPosition && caretPosition < boundry + 1) {

				Nodes.Editing.save();
				
				TraversalHandler.traverse(DOWN);

				Nodes.Editing.start();

			};

			return;

		};

		TraversalHandler.traverse(DOWN);

	}

};

let ClipboardHandler = {

	_selected () {

		let selected = [...SelectionHandler.get()].map(node => {
			
			return {
			
				node:    node,
				content: node.get(CONTENT).textContent,
				level:   node.parents().filter(parent => parent.matches(CHILDREN)).length - 1

			}

		}),

			// * find top-most (== lowest by value) level among selected nodes
			minimum = Math.min(...selected.map(object => object.level));

		// * adjust global level of selected nodes to only count from the highest level among its peers
		selected.forEach(node => node.level -= minimum);

		return selected;

	},

	copy (event) {

		let selected = ClipboardHandler._selected();

		//    * prepend `content` with the required amount of tab characters
		//    * `.level` == 0 => `.repeat()` doesn't repeat
		let data = selected.map(node => "\t".repeat(node.level) + node.content).join("\r\n");

		event.clipboardData.setData("text/plain", data);
		
		event.preventDefault();

	},

	paste (event) {

		let pasted = event.clipboardData.getData("text").split("\r\n");

		if (!pasted) return;

		let formatted = pasted.map(item => {

			return {

				content: item.trim(), // * removes whitespace from original text
				level: item.match(/^\s*/gm).first.length

			}

		});

		// * make sure first item stays on current level
		formatted.first.level = 0;

		let template = document.createElement("template");

		let editing = Mode.current == EDIT;

		editing && Nodes.Editing.save();

		for (node of formatted) {

			let element = Grid.render.node(node);

			template.append(element);

			while (node.level--) {

				let previous = element.previousElementSibling;

				if (!previous) break;

				previous.get(CHILDREN).append(element);

				previous.dataset.hasChildren = "";

			}

		};

		let children = [...template.children];

		for (node of children) {

			if (Grid.current.node == Grid.current.root) {
				
				Grid.current.children.append(node);
			
			} else {
				
				Grid.current.node.after(node);

			};

			Grid.current.node = node;

		};

		editing && Nodes.Editing.start();

	},

	cut (event) {

		let selected = ClipboardHandler._selected();

		ClipboardHandler.copy(event);

		selected.forEach(object => object.node.remove());

		event.preventDefault();

	}

};

let TraversalHandler = {

	_setAsCurrent (node) {

		SelectionHandler.clear();

		Grid.current.node = node;

	},

	vector: {

		get caret () {

			let rect = getSelection().getRangeAt(0).getBoundingClientRect();

			return rect;

		},

		get node () {

			let rect = Grid.current.node.getBoundingClientRect();

			return { x: rect.left, y: rect.top + (rect.height / 2) };

		}

	},

	traverse (direction) {

		let relative = {

				up    () { return Grid.previous.node },
				down  () { return Grid.next.node     }

			},
			
			target = relative[direction]();

		if (!target) return;

		TraversalHandler._setAsCurrent(target);

	}

};

let SelectionHandler = {

	_origin: null, // * origin node for [Shift]+Click selection

	add: {

		one (node) { node.dataset.selected = "" },

		_array (target, origin) {

			let nodes = Grid.nodes,

				index = {
					
					start: nodes.indexOf(origin),
					  end: nodes.indexOf(target)
				
				},

				direction = DOWN;

			if (index.start > index.end) {

				direction = UP;
				
				// * shift in indices necessary to adjust for inverted selection
				[index.start, index.end] = [index.end + 1, index.start + 1];
			
			};
			
			let selected = nodes.slice(index.start, index.end);

			for (node of selected) SelectionHandler.add.one(node);

			let endpoint = {

				[UP]:   nodes[nodes.indexOf(selected[0]) - 1],
				[DOWN]: nodes[index.start + selected.length]

			};

			Grid.current.node = endpoint[direction];

		},

		exclusive (target) {

			// * caching origin node before `.clear()`ing which resets it
			let origin = SelectionHandler._origin;

			SelectionHandler.clear();

			// * if `origin == null` (if first exclusive selection) use `.current.node` for origin
			SelectionHandler._origin = origin || Grid.current.node;

			SelectionHandler.add._array(target, SelectionHandler._origin);

		},

		compounding (target) {

			SelectionHandler.add._array(target, Grid.current.node);

		},

		column () {

			let nodes = [...Grid.nodes];

			for (node of nodes) SelectionHandler.add.one(node);

		}

	},

	// * for `copy` & `drag` events
	// * automatically include current node into selection
	get () { return getAll("[data-selected], [data-current]") },

	remove (node) {
		
		delete node.dataset.selected;

		// * if selection consists of only `.current.node`, reset origin node
		// * corresponds with Indigrid behavior
		if (SelectionHandler.get().length == 1) SelectionHandler._resetOrigin();
	
	},

	clear () {

		let selected = [...SelectionHandler.get()];

		if (selected) for (node of selected) { SelectionHandler.remove(node) };

		SelectionHandler._resetOrigin();

	},

	_resetOrigin () { SelectionHandler._origin = null }

};

let InteractionHandler = {

	_modifiers: ["alt", "altgraph", "control", "meta", "shift"],

	_getCompleteKey (event) {

		let key = "button" in event ? CLICK : event.key.toLowerCase();

		if (key.belongsTo(InteractionHandler._modifiers)) return; // * prevents `shift+shift` etc. keys on `keydown`

		let modKey = /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? event.metaKey : event.ctrlKey;

		let modifiers = [

			modKey         ? MOD   : "",
			event.shiftKey ? SHIFT : "",
			event.altKey   ? ALT   : ""
			
		].join("");

		return modifiers + key;

	},

	click (event) {

		let key    = InteractionHandler._getCompleteKey(event),
			target = event.target,
			node   = target.closest(NODE);

		let _handler = {

			[CLICK] () {

				if (target.matches(NODE) || target.matches(CONTENT) && node != Grid.current.node) {

					return TraversalHandler._setAsCurrent(node);
				
				};

				if (target.matches(CONTENT) && node == Grid.current.node) return Nodes.Editing.start(event);

				if (target.matches(LABEL) && !Grid.previous.sibling(target).checked) {
					
					return Nodes._clearFocus(target);
				
				};

				if (target.matches(BACKDROP)) return Nodes.Editing.save();

			},

			[MOD + CLICK] () {

				if (target == Grid.current.node) return;

				SelectionHandler.add.one(Grid.current.node);

				Grid.current.node = node;

			},

			[SHIFT + CLICK] () {

				SelectionHandler.add.exclusive(node);
				
			},

			[MOD + SHIFT + CLICK] () {

				SelectionHandler.add.compounding(node);

			},

			[MOD + ALT + CLICK] () {

				SelectionHandler.remove(node);

			}

		};

		_handler[key] && _handler[key]();

	},

	keydown (event) {

		let key = InteractionHandler._getCompleteKey(event),
			exclusions = ["mod+r", "mod+shift+i"];

		if (!key || key.belongsTo(exclusions)) return;

		// * adds eager-editing support for Backspace
		if (key == BACKSPACE) InteractionHandler.keypress(event);

		let hotkey = InteractionHandler._hotkeys[key];

		if (hotkey) {
			
			typeof hotkey.action == "function" ? hotkey.action() : ActionHistory.execute(hotkey.action);

			if (!key.belongsTo([ARROWUP, ARROWDOWN, ARROWLEFT, ARROWRIGHT])) {

				event.preventDefault();
				event.stopPropagation();

				return false;

			}

		};

	},

	keypress (event) {

		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

		Nodes.Editing.start(); // * ← enough to enable eager editing

		// * [Backspace] support ← `.keydown()`

	},

	_hotkeys: {},

	registerHotkey (combo, action) {

		let hotkey       = { action },
			combination  =   combo.toLowerCase();

		InteractionHandler._hotkeys[combination] = hotkey;

	}

};

let Debug = {

	clear: false, // * informs the app that the image should be erased and the current state not saved

};


//  # INITIALIZATION

addEventListener("load", () => {

	ActionHistory.image.load();

	Grid.initialize();

});

//  # EVENT HANDLERS

// ## GENERIC

window.addEventListener(CLICK,    InteractionHandler.click);

window.addEventListener(KEYDOWN,  InteractionHandler.keydown);
window.addEventListener(KEYPRESS, InteractionHandler.keypress);


// ## TRAVERSAL

InteractionHandler.registerHotkey(ARROWUP,    WorkflowHandler[ARROWUP]);
InteractionHandler.registerHotkey(ARROWDOWN,  WorkflowHandler[ARROWDOWN]);


// ## MANIPULATION

InteractionHandler.registerHotkey(ENTER,         CREATE);

InteractionHandler.registerHotkey(DELETE,        REMOVE);

InteractionHandler.registerHotkey(ALT + ENTER,   BISECT);

InteractionHandler.registerHotkey(SHIFT + ENTER, CREATE + ABOVE);

InteractionHandler.registerHotkey(MOD + SHIFT + ARROWUP,   MOVE + BEFORE);
InteractionHandler.registerHotkey(MOD + SHIFT + ARROWDOWN, MOVE + AFTER);


// ## EDITING

InteractionHandler.registerHotkey(F2,          EDIT);
InteractionHandler.registerHotkey(MOD + ENTER, SAVE);


// ## DENTATION

InteractionHandler.registerHotkey(TAB,         INDENT);
InteractionHandler.registerHotkey(SHIFT + TAB, OUTDENT);


// ## FOLDING

InteractionHandler.registerHotkey(MOD + ARROWUP,   FOLD);
InteractionHandler.registerHotkey(MOD + ARROWDOWN, UNFOLD);

// ## EXCHANGE

addEventListener(COPY,  ClipboardHandler.copy);
addEventListener(PASTE, ClipboardHandler.paste);
addEventListener(CUT,   ClipboardHandler.cut);

// ## WORKFLOW

InteractionHandler.registerHotkey(ESCAPE, WorkflowHandler[ESCAPE]);

addEventListener(WHEEL, WorkflowHandler[WHEEL]);

// ## CLOSING

addEventListener("beforeunload", () => {

	if (Mode.current == EDIT) Nodes.Editing.save();

	if (Debug.clear) {

		localStorage.clear();

		return;

	}

	ActionHistory.image.store();

	return true;

});