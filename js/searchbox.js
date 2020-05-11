(function(){
	'use strict';

	/*
		SearchBox Component
		Author: Satya Rohit A

		Refer the screen recording given for a video of the functionality.

		Just open the index.html file in the browser to try it out.
	*/

	const tmpl = document.createElement('template');
	tmpl.innerHTML = `
		<style>
			:host {
			}
			:host([hidden]) {
				display: none;
			}
			.search-box{
				width: 100%;
				background-color: #eee;
				border-radius: 3px;
			}

			.search-box.active{
				box-shadow: 0 1px 6px 0 rgba(32,33,36,0.28);
			}

			.search-box, .search-box .input-box input{
				background-color: #eee;
			}

			.search-box.active, .search-box.active .input-box input{
				background-color: #fff;
			}

			.search-box.active .input-box{
				border-bottom: 1px solid #d5d5d5;
			}

			.search-box .cursor-pointer{
				cursor: pointer;
			}

			.search-box .input-box{
				display: flex;
				flex-direction: row;
				padding: 8px 15px 0 15px;
			}

			.search-box .input-box input{
				flex: 1;
				margin-bottom: 8px;
				outline: none;
				border: none;
				overflow: hidden;
			    text-overflow: ellipsis;
			    white-space: nowrap;
			}

			.search-box .input-box .clear-text{
				display: none;
				padding-left: 8px;
				padding-bottom: 5px;
				color: #aaa;
			}

			.search-box .search-results > ul{
				max-height: 300px;
				overflow-y: scroll;
				font-size: 0.9em;
				text-transform: capitalize;
			}

			.search-box .search-results ul{
				list-style-type: none;
				margin: 0px;
				padding: 0px;
			}

			.search-box .search-results .user{
				padding: 10px 15px;
				border-top: 1px solid #d5d5d5;
			}

			.search-box .search-results .user:hover{
				background-color: none;
			}

			.search-box .search-results .user.active{
				background-color: #ffff88;
			}

			.search-box .search-results .user ul{
				padding: 2px 0px 2px 15px; 
				border-top: 1px solid #d5d5d5;
				border-bottom: 1px solid #d5d5d5;
			}

			.search-box .search-results .user ul li::before {
			  content: "•"; 
			  color: #87ceeb;
			  font-weight: bold;
			  display: inline-block; 
			  width: 1em;
			  margin-left: -1em;
			}

			.search-box .search-results .user .user-id{
				font-weight: 600;
			}

			.search-box .search-results .user .user-name{
				font-style: italic;
			}

			.search-box .search-results .user .user-address{
				margin: 5px 0px;
				display: -webkit-box;
			    overflow: hidden;
			    text-overflow: ellipsis;
			    -webkit-line-clamp: 2;
			    -webkit-box-orient: vertical;
			}

			.search-box .search-results .not-found{
				display: none;
				padding: 50px;
				text-align: center;
				color: #aaa;
			}
		</style> 
	  	<div class="search-box">
	      <div class="input-box">
	        <input type="text" placeholder="Search users by ID, name, address, items, pincode" maxlength="2048" aria-label="Search users by ID, name, address, items, pincode" role="searchbox"/>
	        <span class="clear-text cursor-pointer" aria-label="Clear">&times;</span>
	      </div>
	      <div class="search-results">
	        <ul></ul>
	        <div class="not-found">No User Found</div>
	      </div>
	    </div>
	`;

	window.customElements.define('search-box', class extends HTMLElement {

		constructor(){
			super();

			let shadowRoot = this.attachShadow({mode: 'open'});
			shadowRoot.appendChild(tmpl.content.cloneNode(true));
			
			this.data = [];
			this._curHover = null;
			this._curText = "";
			this._blockMouse = false;
		}

		// results is the property used to save the search list array while using this component
		get results() {
    		return this.getAttribute('results');
  		}

  		set results(value) {
    		this.data = value;
  		}

		connectedCallback(){
			if (!this.hasAttribute('role'))
	        	this.setAttribute('role', 'searchbox');

	        this._onKeyUp = this._onKeyUp.bind(this);
	        this._onSearchFocus = this._onSearchFocus.bind(this);
	        this._onSearchFocusOut =  this._onSearchFocusOut.bind(this);
	        this._onMouseOver = this._onMouseOver.bind(this);
	        this._onMouseLeave = this._onMouseLeave.bind(this);
	        this._clearSearchBox = this._clearSearchBox.bind(this);

	        this._textInputTarget = this.shadowRoot.querySelector('.search-box .input-box input');
	        this._resultsTarget = this.shadowRoot.querySelector('.search-box .search-results');
	        this._clearTextTarget = this.shadowRoot.querySelector('.search-box .input-box .clear-text');

	        this._textInputTarget.addEventListener('keyup', this._onKeyUp);
	        this._textInputTarget.addEventListener('focus', this._onSearchFocus);
	        this._textInputTarget.addEventListener('blur', this._onSearchFocusOut);
			this._resultsTarget.addEventListener('mouseover', this._onMouseOver);
			this._resultsTarget.addEventListener('mouseleave', this._onMouseLeave);
			this._clearTextTarget.addEventListener('click', this._clearSearchBox);
		}

		disconnectedCallback(){
			this._textInputTarget.removeEventListener('keyup', this._onKeyUp);
			this._textInputTarget.removeEventListener('focus', this._onSearchFocus);
	        this._textInputTarget.removeEventListener('blur', this._onSearchFocusOut);
	        this._resultsTarget.removeEventListener('mouseover', this._onMouseOver);
			this._resultsTarget.removeEventListener('mouseleave', this._onMouseLeave);
			this._clearTextTarget.removeEventListener('click', this._clearSearchBox);
			this._textInputTarget = null;
			this._resultsTarget = null;
			this._clearTextTarget = null;
		}

		_onKeyUp(e){
			if (e.altKey)
        		return;

			switch(e.keyCode){
				case 38: //up
					this._handleKeyHover('up');
					break;
				case 40: //down
					this._handleKeyHover('down');
					break;
				default:
					if(this._curText !== e.target.value){ //only characters
						this._curText = e.target.value.trim();
						this._curHover = null;
						this._updateResults(this._filterList(this._curText), this._curText);
					}
			}
		}

		_onSearchFocus(e){
			this.shadowRoot.querySelector('.search-box').classList.add('active'); //activate search box
		}

		_onSearchFocusOut(e){ //deactivate search box
			this._clearSearchBox();
			this.shadowRoot.querySelector('.search-box').classList.remove('active'); 
		}

		_onMouseOver(e){
			if(this._blockMouse){
				return;
			}
			if((e.target.nodeName.toLowerCase() === 'li') && (Array.prototype.indexOf.call(e.target.classList, "user")> -1)){ //if top level parent list item
				let resultElem = this.shadowRoot.querySelectorAll('.search-box .search-results > ul .user'); //list item
				if(this._curHover!== null){ 
					resultElem[this._curHover].classList.remove('active'); //remove hover on prev elem
				}
				this._curHover = e.target.getAttribute('data-item-key');
				resultElem[this._curHover].classList.add('active'); //hover current elem
				this._scrollInView(resultElem);
			}
		}

		_onMouseLeave(e){ //mouse hover out of list, remove highlight 
			if(this._curHover !== null){
				this.shadowRoot.querySelectorAll('.search-box .search-results > ul .user')[this._curHover].classList.remove('active');
				this._curHover = null;
			}
		}

		_filterList(text){ //filter list using search text
			if(!text){
				return [];
			}
			return this.data.filter(user => {
				for(let key in user){
					let pattern = new RegExp(text, "gi");
					if(pattern.test(user[key])){
						return true;
					}
				}
			});
		}

		_updateResults(items, text){

			let listElem = this.shadowRoot.querySelector('.search-box .search-results > ul');
			listElem.textContent = "";

			this._handleNotFound(!!items.length, text);
			this._handleClearText(text);

			if(!items.length){
				return;
			}

			let fragment = document.createDocumentFragment();
			items.forEach((item, i) => { //create and add data for each list element
				let li = document.createElement("li");
				li.setAttribute('data-item-id', item.id);
				li.setAttribute('data-item-key', i);
				li.className = "user cursor-pointer";

				let id = document.createElement("div");
				id.textContent = item.id;
				id.className = "user-id";
				li.appendChild(id);

				let name = document.createElement("div");
				name.textContent = item.name;
				name.className = "user-name";
				li.appendChild(name);

				let user_items = document.createElement("ul");
				item.items.forEach(user_item => {
					let itm = document.createElement("li");
					itm.textContent = user_item;
					user_items.appendChild(itm);
				});
				user_items.className = "user-items";
				li.appendChild(user_items);

				let address = document.createElement("p");
				address.textContent = item.address;
				address.className = "user-address";
				li.appendChild(address);		

				fragment.appendChild(li);
			});

			listElem.appendChild(fragment);

		}

		_handleNotFound(itemsExist, text){
			let notFound = this.shadowRoot.querySelector('.search-box .search-results .not-found');

			if(!text || itemsExist){
				if(notFound.style.display !== "none"){
					notFound.style.display = "none";
				}
			}
			else{ 
				if(notFound.style.display !== "block"){
					notFound.style.display = "block";
				}
			}
		}

		_handleClearText(text){
			if(!text){
				this._clearTextTarget.style.display = 'none';
			}
			else{
				this._clearTextTarget.style.display = 'inline-block';
			}
		}

		_handleKeyHover(type){
			let resultElem = this.shadowRoot.querySelectorAll('.search-box .search-results > ul .user');
			switch(type){
				case 'up':
					if(this._curHover !== null){ //if an element is already highlighted, update to new highlight 
						resultElem[this._curHover].classList.remove('active');	
						(this._curHover > 0)?this._curHover--:this._curHover = resultElem.length - 1;
					}
					else{ //nothing is highlighted
						this._curHover = resultElem.length - 1;
					}
					break;
				case 'down':
					if(this._curHover !== null){ //if element is highlighted 
						resultElem[this._curHover].classList.remove('active');	
						if(this._curHover !== (this.shadowRoot.querySelectorAll('.search-box .search-results > ul .user').length-1)){ //not last element, update highlight
							this._curHover++;
						}
						else{ //last element, update highlight
							this._curHover = 0;
						}
					}
					else{ //if no element is highlighted
						this._curHover = 0;	
					}
					break;
			}
			if(this._curHover !== null){  //set highlight to current element
				resultElem[this._curHover].classList.add('active');
				this._scrollInView(resultElem);
			}
		}

		_scrollInView(elem){ //scrollIntoView
			let containerHeight = elem[this._curHover].parentNode.offsetHeight;
			let offset = containerHeight - ((elem[this._curHover].offsetTop - elem[this._curHover].parentNode.offsetTop)%containerHeight);
			
			this._blockMouse = true;
			if(offset>=elem[this._curHover].offsetHeight){ //if fill element is viewable
				elem[this._curHover].parentNode.scrollTop = elem[this._curHover].offsetTop - elem[this._curHover].parentNode.offsetTop;
			}
			else{
				elem[this._curHover].parentNode.scrollBy({top:(elem[this._curHover].offsetHeight-offset),left:0,behaviour:'smooth'});
			}
			
			setTimeout(()=>{ //prevent unnecassary mouse events before scroll is done
				this._blockMouse = false;
			},10);

			//Alternative native browser function. Can replace above code with just this function but will always scroll element to top
			//elem[this._curHover].scrollIntoView({ behavior: 'smooth'});
		}

		_clearSearchBox(){
			this._curHover = null;
			this._textInputTarget.value = "";
			this._curText = "";
			this._updateResults([], '');
		}

	});

}());