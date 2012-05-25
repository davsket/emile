// emile.js (c) 2009 Thomas Fuchs
// Licensed under the terms of the MIT license.

(function(emile, container){
  var parseEl = document.createElement('div'),
    props = ('backgroundColor borderBottomColor borderBottomWidth borderLeftColor borderLeftWidth '+
    'borderRightColor borderRightWidth borderSpacing borderTopColor borderTopWidth bottom color fontSize '+
    'fontWeight height left letterSpacing lineHeight marginBottom marginLeft marginRight marginTop maxHeight '+
    'maxWidth minHeight minWidth opacity outlineColor outlineOffset outlineWidth paddingBottom paddingLeft '+
    'paddingRight paddingTop right textIndent top width wordSpacing zIndex webkitTransform WebkitTransform '+
    'MozTransform mozTransform msTransform MSTransform OTransform oTransform').split(' ');

    //Erik Möller & Paul Irish Robust Plyfill
  	(function() {
	    var lastTime = 0, vendors = ['ms', 'moz', 'webkit', 'o'], x = 0;
	    for(; x < vendors.length && !window.requestAnimationFrame; x++) {
	        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
	        window.cancelAnimationFrame = 
	          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
	    }
	 
	    if (!window.requestAnimationFrame)
	        window.requestAnimationFrame = function(callback, element) {
	            var currTime = new Date().getTime(), timeToCall = Math.max(0, 16 - (currTime - lastTime)),
	            	id = setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
	            lastTime = currTime + timeToCall;
	            return id;
	        };
	 
	    if (!window.cancelAnimationFrame)
	        window.cancelAnimationFrame = function(id) {clearTimeout(id)};
	}());

	function interpolate(source,target,pos){return (source+(target-source)*pos).toFixed(3); }
	function s(str, p, c){ return str.substr(p,c||1); }
	function color(source,target,pos){
		var i = 2, j, c, tmp, v = [], r = [];
		while(j=3,c=arguments[i-1],i--)
			if(s(c,0)=='r') { c = c.match(/\d+/g); while(j--) v.push(~~c[j]); } else {
				if(c.length==4) c='#'+s(c,1)+s(c,1)+s(c,2)+s(c,2)+s(c,3)+s(c,3);
				while(j--) v.push(parseInt(s(c,1+j*2,2), 16)); }
		while(j--) { tmp = ~~(v[j+3]+(v[j]-v[j+3])*pos); r.push(tmp<0?0:tmp>255?255:tmp); }
		return 'rgb('+r.join(',')+')';
	}
	function interpolateTransform(source,target,pos){
		var sourceProps = !source || source == 'none' ? [] : source.match(/\w+\([\-\w\.\,\s]+\)/g),
			targetProps = !target || target == 'none' ? sourceProps : target.match(/\w+\([\-\w\.\,\s]+\)/g), 
			res = [], i = 0, j = 0, targetObj = {}, sourceObj = {}, prop, interpolated, temparr;
		for(;i<sourceProps.length;i++){
			sourceObj[sourceProps[i].split(/[\-\d\.\,]+/).join('')] = sourceProps[i];
			//Target obj needs to have all properties
			targetObj[sourceProps[i].split(/[\-\d\.\,]+/).join('')] = sourceProps[i]; 
		} 
		for(i=0;targetProps.length && targetProps[i];i++){
			targetObj[targetProps[i].split(/[\-\d\.\,]+/).join('')] = targetProps[i];	
		} 
		i = 0;
		for(prop in targetObj){
			var sourcevals = 0, targetvals = targetObj[prop].match(/[\-\d\.]+/g);
			if(sourceObj[prop]){
				sourcevals = sourceObj[prop].match(/[\-\d\.]+/)[0]
			}
			temparr = targetObj[prop].split(/[\-\d\.]+/);
			for(j=0;j<targetvals.length;j++){
				interpolated = interpolate(+sourcevals[j]||0,+targetvals[j], pos)
				temparr.splice(1+2*j,0,interpolated);
			}
			res[i] = temparr.join('');
			i++;
		}
		return res.join(' ');
	}
  
	function parse(prop){
		var p = parseFloat(prop), q = prop.replace(/^[\-\d\.]+/,'');
		if(!prop.match(/rotate|translate|scale|skewX|skewY/))
			return isNaN(p) ? { v: q, f: color, u: ''} : { v: p, f: interpolate, u: q };
		return {v: q, f: interpolateTransform, u: ''}
	}
  
	function normalize(style){
		var css, rules = {}, i = props.length, v;
		parseEl.innerHTML = '<div style="'+style+'"></div>';
		//here is where it fails
		css = parseEl.childNodes[0].style;
		while(i--) if(v = css[props[i]]) rules[props[i]] = parse(v);
		return rules;
	}  
  
	container[emile] = function(el, style, opts, after){
		el = typeof el == 'string' ? document.getElementById(el) : el;
		opts = opts || {};
		var target = normalize(style), comp = el.currentStyle ? el.currentStyle : getComputedStyle(el, null),
		  prop, current = {}, start = +new Date, dur = opts.duration||200, finish = start+dur, interval,
		  easing = opts.easing || function(pos){ return (-Math.cos(pos*Math.PI)/2) + 0.5; };
		//in transformations currentStyle gives a matrix, contrary to style
		for(prop in target){current[prop] = !~prop.indexOf('Transform') ? parse(comp[prop]) : parse(el.style[prop]);}
		interval = requestAnimationFrame(function animation(){
			var time = new Date().getTime(), pos = time>finish ? 1 : (time-start)/dur;
			for(prop in target){
				el.style[prop] = target[prop].f(current[prop].v,target[prop].v,easing(pos)) + target[prop].u;
			}
			if(time>finish) { cancelAnimationFrame(interval); opts.after && opts.after(); after && setTimeout(after,1); }
			else requestAnimationFrame(animation)
		},10);
	}
})('emile', this);