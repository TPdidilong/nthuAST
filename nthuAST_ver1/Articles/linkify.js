/* 
Linkify Plus Edit by Eight
based on Linkify Plus ver 2.0.1
added img support
*/

// ==UserScript==
// @name        Linkify Plus
// @homepage    http://www.arantius.com/article/arantius/linkify+plus/
// @version     2.0.1
// @namespace   http://www.arantius.com/misc/greasemonkey/
// @description	Turn plain text URLs into links.  Supports http, https, ftp, email addresses
// @include     *
// @exclude     http://www.google.tld/search*
// ==/UserScript==

/**
Loosely based on the Linkify script located at:
  http://downloads.mozdev.org/greasemonkey/linkify.user.js

Originally written by Anthony Lieuallen of http://arantius.com/
Licensed for unlimited modification and redistribution as long as
this notice is kept intact.

If possible, please contact me regarding new features, bugfixes
or changes that I could integrate into the existing code instead of
creating a different script.  Thank you

Version history:
 Version 2.0.1:
  - Fix aberrant 'mailto:' where it does not belong.
 Version 2.0:
  - Apply incrementally, so the browser does not hang on large pages.
  - Continually apply to new content added to the page (i.e. AJAX).
 Version 1.1.4:
  - Basic "don't screw up xml pretty printing" exception case
 Version 1.1.3:
  - Include "+" in the username of email addresses.
 Version 1.1.2:
  - Include "." in the username of email addresses.
 Version 1.1:
  - Fixed a big that caused the first link in a piece of text to
    be skipped (i.e. not linkified).
*/

var enable_linkified = /*@Enable actual linkifier.@bool@*/true/*@*/;
var dry_run_linkified = /*@Just pretend to linkify, only simulate.@bool@*/false/*@*/;
var show_numer_of_linkified = /*@Display numer (if more than zero) of linkified URLs after linkifing.@bool@*/false/*@*/;
var prefix_linkified = /*@Prefix linkified URLs by [L+].@bool@*/false/*@*/;
var prefix_space_linkified = /*@Add space beetwen prefix [L+] and URL. (sometimes helps).@bool@*/false/*@*/;
var log_all_linkified = /*@Use console.log() function to show all linkified URLs (will make it slightly slower, use only when debugging in DragonFly).@bool@*/true/*@*/;
var add_title_linkified = /*@Add title attribute to linkified link.@bool@*/true/*@*/;

var notInTags = ['a', 'head', 'noscript', 'option', 'script', 'style', 'title', 'textarea'];
var textNodeXpath = ".//text()[not(ancestor::" + notInTags.join(') and not(ancestor::') + ")]";
var urlRE = /((?:https?|ftp)(?::|&#58;)\/\/[^\s'"'<>()]+|www\.[^\s'"'<>()]+|[-\w.+]+@(?:[-\w]+\.)+[\w]{2,6})/gi;
//var queue = [];
var counter_linkified = 0;

if (enable_linkified) {
	if (document.contentType != "text/xml" && document.contentType != "application/xml") {
		linkifyContainer(document.body);
		//document.body.addEventListener('DOMNodeInserted', function(event) { linkifyContainer(event.target); }, false);
	}
}

function linkifyContainer(container) {
	var xpathResult = document.evaluate(textNodeXpath, container, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);

	var i = 0;
	var linkified = 0;
	function continuation() {
		var node;
		var limit = 0;
		while (node = xpathResult.snapshotItem(i++)) {
			linkified += linkifyTextNode(node);

			if (++limit>80) {
				return setTimeout(continuation, 0);
			}
		}
		if (show_numer_of_linkified && (linkified > 0)) {
			alert("Linkified " +(dry_run_linkified ? "(dry run) " : "") + linkified + " URLs");
		}
	}

	setTimeout(continuation, 0);
}

function linkifyTextNode(node) {
	var i, m;
	var txt = node.textContent;
	var span = null;
	var p = 0;
	var k = 0;

	var common_title = "Linkified from plain text using Linkify Plus";
	var common_class = 'linkifyplus';

	if (node.parentNode.nodeName == "A") {
		return 0;
	}

	while (m = urlRE.exec(txt)) {
		// check if it is in some <a> tag. This should not be nacassary becuase XPath is constructed so, but there are some problems in Opera 10.50 :(
		// continue;

		if (log_all_linkified) {
			try {
				console.log("linkifing ("+k+"): "+ m[0]);
				console.log("parentNode ("+k+"): " + node.parentNode.nodeName);
			} catch (e) {}
		}
		//alert(node.parentNode);
		if (node.parentNode.nodeName == "BODY") {
			continue;
		}
		//alert(node);

		if (span == null) {
			//create a span to hold the new text with links in it
			if (!dry_run_linkified) {
				span = document.createElement('span');
			}
		}

		//get the link without trailing dots, comas and question, exclamation mark
		var l_org = m[0].replace(/[.,?!]*$/, '');
		var l = l_org;
		var lrest = m[0].substring(l.length, m[0].length);
		var inner_text = l;
		if (prefix_linkified) {
			inner_text = (prefix_space_linkified ? "[L+] " : "[L+]") + l;
		}
		//put in text up to the link
		if (!dry_run_linkified) {
			span.appendChild(document.createTextNode(txt.substring(p, m.index)));
		}
		//create a link and put it in the span
		var a = document.createElement('a');
		a.className = common_class;
		if(/\.jpg|\.jpeg|\.gif|\.png/.test(inner_text)){
			var img=document.createElement("img");
			img.src=inner_text;
			img.alt=inner_text;
			a.appendChild(img);
		}else
			a.appendChild(document.createTextNode(inner_text));
		if (l.indexOf('www') == 0) {
			l ='http://' + l;
		} else if (l.indexOf('://') == -1 && l.indexOf("@") > 0) {
			l = 'mailto:' + l;
		}
		a.setAttribute('href', l);
		if (add_title_linkified) {
			a.setAttribute('title', common_title + " ("+counter_linkified+"): "+ l_org);
		}
		if (!dry_run_linkified) {
			span.appendChild(a);
			span.appendChild(document.createTextNode(lrest));
		}
		//track insertion point
		p = m.index + m[0].length;
		k++;
		counter_linkified++;
	}
	if (span) {
		//take the text after the last link
		if (!dry_run_linkified) {
			span.appendChild(document.createTextNode(txt.substring(p, txt.length)));
		}
		//replace the original text with the new span
		try {
			if (!dry_run_linkified) {
				node.parentNode.replaceChild(span, node);
			}
		} catch (e) {
			try {
				console.error(e);
				console.log(node);
			} catch (ee) { }
		}
	}
	return k;
}

