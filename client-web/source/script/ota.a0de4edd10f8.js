/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2006, 2007 Derrell Lipman
     2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Derrell Lipman (derrell)
     * Daniel Wagner (d_wagner)

************************************************************************ */

/**
 * Useful debug capabilities
 */
qx.Class.define("qx.dev.Debug",
{
  statics :
  {
    /**
     * Flag that shows whether dispose profiling is currently active
     * @internal
     */
    disposeProfilingActive : false,

    /**
     * Recursively display an object (as a debug message)
     *
     *
     * @param obj {Object}
     *   The object to be recursively displayed
     *
     * @param initialMessage {String|null}
     *   The initial message to be displayed.
     *
     * @param maxLevel {Integer ? 10}
     *   The maximum level of recursion.  Objects beyond this level will not
     *   be displayed.
     *
     */
    debugObject : function(obj, initialMessage, maxLevel)
    {
      // We've compiled the complete message.  Give 'em what they came for!
      qx.log.Logger.debug(this,
                          qx.dev.Debug.debugObjectToString(obj,
                                                           initialMessage,
                                                           maxLevel,
                                                           false));
    },

    /**
     * Recursively display an object (into a string)
     *
     *
     * @param obj {Object}
     *   The object to be recursively displayed
     *
     * @param initialMessage {String|null}
     *   The initial message to be displayed.
     *
     * @param maxLevel {Integer ? 10}
     *   The maximum level of recursion.  Objects beyond this level will not
     *   be displayed.
     *
     * @param bHtml {Boolean ? false}
     *   If true, then render the debug message in HTML;
     *   Otherwise, use spaces for indentation and "\n" for end of line.
     *
     * @return {String}
     *   The string containing the recursive display of the object
     *
     * @lint ignoreUnused(prop)
     */
    debugObjectToString : function(obj, initialMessage, maxLevel, bHtml)
    {
      // If a maximum recursion level was not specified...
      if (!maxLevel)
      {
        // ... then create one arbitrarily
        maxLevel = 10;
      }

      // If they want html, the differences are "<br>" instead of "\n"
      // and how we do the indentation.  Define the end-of-line string
      // and a start-of-line function.
      var eol = (bHtml ? "</span><br>" : "\n");
      var sol = function(currentLevel)
      {
        var indentStr;
        if (! bHtml)
        {
          indentStr = "";
          for (var i = 0; i < currentLevel; i++)
          {
            indentStr += "  ";
          }
        }
        else
        {
          indentStr =
            "<span style='padding-left:" + (currentLevel * 8) + "px;'>";
        }
        return indentStr;
      };

      // Initialize an empty message to be displayed
      var message = "";

      // Function to recursively display an object
      var displayObj = function(obj, level, maxLevel)
      {
        // If we've exceeded the maximum recursion level...
        if (level > maxLevel)
        {
          // ... then tell 'em so, and get outta dodge.
          message += (
            sol(level) +
              "*** TOO MUCH RECURSION: not displaying ***" +
              eol);
          return;
        }

        // Is this an ordinary non-recursive item?
        if (typeof (obj) != "object")
        {
          // Yup.  Just add it to the message.
          message += sol(level) + obj + eol;
          return;
        }

        // We have an object  or array.  For each child...
        for (var prop in obj)
        {
          // Is this child a recursive item?
          if (typeof (obj[prop]) == "object")
          {
            try
            {
              // Yup.  Determine the type and add it to the message
              if (obj[prop] instanceof Array)
              {
                message += sol(level) + prop + ": " + "Array" + eol;
              }
              else if (obj[prop] === null)
              {
                message += sol(level) + prop + ": " + "null" + eol;
                continue;
              }
              else if (obj[prop] === undefined)
              {
                message += sol(level) + prop + ": " + "undefined" + eol;
                continue;
              }
              else
              {
                message += sol(level) + prop + ": " + "Object" + eol;
              }

              // Recurse into it to display its children.
              displayObj(obj[prop], level + 1, maxLevel);
            }
            catch (e)
            {
              message +=
                sol(level) + prop + ": EXCEPTION expanding property" + eol;
            }
          }
          else
          {
            // We have an ordinary non-recursive item.  Add it to the message.
            message += sol(level) + prop + ": " + obj[prop] + eol;
          }
        }
      };

      // Was an initial message provided?
      if (initialMessage)
      {
        // Yup.  Add it to the displayable message.
        message += sol(0) + initialMessage + eol;
      }

      if (obj instanceof Array)
      {
        message += sol(0) + "Array, length=" + obj.length + ":" + eol;
      }
      else if (typeof(obj) == "object")
      {
        var count = 0;
        for (var prop in obj)
        {
          count++;
        }
        message += sol(0) + "Object, count=" + count + ":" + eol;
      }

      message +=
        sol(0) +
        "------------------------------------------------------------" +
        eol;

      try
      {
        // Recursively display this object
        displayObj(obj, 0, maxLevel);
      }
      catch(ex)
      {
        message += sol(0) + "*** EXCEPTION (" + ex + ") ***" + eol;
      }

      message +=
        sol(0) +
        "============================================================" +
        eol;

      return message;
    },


    /**
     * Get the name of a member/static function or constructor defined using the new style class definition.
     * If the function could not be found <code>null</code> is returned.
     *
     * This function uses a linear search, so don't use it in performance critical
     * code.
     *
     * @param func {Function} member function to get the name of.
     * @param functionType {String?"all"} Where to look for the function. Possible values are "members", "statics", "constructor", "all"
     * @return {String|null} Name of the function (null if not found).
     */
    getFunctionName: function(func, functionType)
    {
      var clazz = func.self;
      if (!clazz) {
        return null;
      }

      // unwrap
      while(func.wrapper) {
        func = func.wrapper;
      }

      switch (functionType)
      {
        case "construct":
          return func == clazz ? "construct" : null;

        case "members":
          return qx.lang.Object.getKeyFromValue(clazz, func);

        case "statics":
          return qx.lang.Object.getKeyFromValue(clazz.prototype, func);

        default:
          // constructor
          if (func == clazz) {
            return "construct";
          }

          return (
            qx.lang.Object.getKeyFromValue(clazz.prototype, func) ||
            qx.lang.Object.getKeyFromValue(clazz, func) ||
            null
          );
      }
    },


    /**
     * Returns a string representing the given model. The string will include
     * all model objects to a given recursive depth.
     *
     * @param model {qx.core.Object} The model object.
     * @param maxLevel {Number ? 10} The amount of max recursive depth.
     * @param html {Boolean ? false} If the returned string should have \n\r as
     *   newline of <br>.
     * @param indent {Number ? 1} The indentation level.
     *   (Needed for the recursion)
     *
     * @return {String} A string representation of the given model.
     */
    debugProperties: function(model, maxLevel, html, indent) {
      // set the default max depth of the recursion
      if (maxLevel == null) {
        maxLevel = 10;
      }
      // set the default startin indent
      if (indent == null) {
        indent = 1;
      }

      var newLine = "";
      html ? newLine = "<br>" : newLine = "\r\n";

      var message = "";

      if (
        qx.lang.Type.isNumber(model)
        || qx.lang.Type.isString(model)
        || qx.lang.Type.isBoolean(model)
        || model == null
        || maxLevel <= 0
      ) {
        return model;

      } else if (qx.Class.hasInterface(model.constructor, qx.data.IListData)) {
        // go threw the data structure
        for (var i = 0; i < model.length; i++) {
          // print out the indentation
          for (var j = 0; j < indent; j++) {
            message += "-"
          }
          message += "index(" + i + "): "
            + this.debugProperties(model.getItem(i), maxLevel - 1, html, indent + 1)
            + newLine;
        }
        return message + newLine;

      } else if (model.constructor != null) {
        // go threw all properties
        var properties = model.constructor.$$properties;
        for (var key in properties) {
          message += newLine;
          // print out the indentation
          for (var j = 0; j < indent; j++) {
            message += "-"
          }
          message += " " + key + ": " + this.debugProperties(
            model["get" + qx.lang.String.firstUp(key)](), maxLevel - 1, html, indent + 1
          );
        }
        return message;
      }
      return "";
    },


    /**
     * Starts a dispose profiling session. Use {@link #stopDisposeProfiling} to
     * get the results
     *
     * @signature function()
     */
    startDisposeProfiling : qx.core.Environment.select("qx.debug.dispose", {
      "true" : function() {
        this.disposeProfilingActive = true;
        this.__nextHashFirst = qx.core.ObjectRegistry.getNextHash();
      },

      "default" : (function() {})
    }),


    /**
     * Returns a list of any (qx) objects that were created but not disposed since
     * {@link #startDisposeProfiling} was called. Also returns a stack trace
     * recorded at the time the object was created.
     *
     * @signature function(checkFunction)
     * @param checkFunction {Function} Custom check function. It is called once
     * for each object that was created after dispose profiling was started,
     * with the object as the only parameter. If it returns false, the object
     * will not be included in the returned list
     * @return {Map[]} List of maps. Each map contains two keys:
     * <code>object</code> and <code>stackTrace</code>
     */
    stopDisposeProfiling : qx.core.Environment.select("qx.debug.dispose", {
      "true" : function(checkFunction) {
        if (!this.__nextHashFirst) {
          qx.log.Logger.error("Call " + this.classname + ".startDisposeProfiling first.");
          return [];
        }

        //qx.core.ObjectRegistry.saveStackTraces = false;
        this.disposeProfilingActive = false;

        var undisposedObjects = [];
        // If destroy calls another destroy, flushing the queue once is not enough
        while (!qx.ui.core.queue.Dispose.isEmpty()) {
          qx.ui.core.queue.Dispose.flush();
        }
        var nextHashLast = qx.core.ObjectRegistry.getNextHash();
        var postId = qx.core.ObjectRegistry.getPostId();
        var traces = qx.core.ObjectRegistry.getStackTraces();
        for (var hash = this.__nextHashFirst; hash<nextHashLast; hash++) {
          var obj = qx.core.ObjectRegistry.fromHashCode(hash + postId);
          if (obj && obj.isDisposed && !obj.isDisposed()) {
            // User-defined check
            if (checkFunction && typeof checkFunction == "function" &&
              !checkFunction(obj)) {
                continue;
            }
            // Singleton instances
            if (obj.constructor.$$instance === obj) {
              continue;
            }
            // Event handlers
            if (qx.Class.implementsInterface(obj, qx.event.IEventHandler)) {
              continue;
            }
            // Pooled Decorators
            if (obj.$$pooled) {
              continue;
            }
            // Dynamic decorators
            if (qx.Class.implementsInterface(obj, qx.ui.decoration.IDecorator) &&
              qx.theme.manager.Decoration.getInstance().isCached(obj)) {
              continue;
            }
            // ignored objects
            if (obj.$$ignoreDisposeWarning) {
              continue;
            }
            // Dynamic fonts
            if (obj instanceof qx.bom.Font &&
              qx.theme.manager.Font.getInstance().isDynamic(obj)) {
              continue;
            }
            undisposedObjects.push({
              object : obj,
              stackTrace : traces[hash + postId] ? traces[hash + postId] : null
            });
          }
        }
        delete this.__nextHashFirst;
        return undisposedObjects;
      },

      "default" : (function() {})
    })
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Fabian Jakobs (fjakobs)
     * Mustafa Sak (msak)

************************************************************************ */

/**
 * A wrapper for CSS font styles. Fond objects can be applied to instances
 * of {@link qx.html.Element}.
 */
qx.Class.define("qx.bom.Font",
{
  extend : qx.core.Object,




  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param size {String?} The font size (Unit: pixel)
   * @param family {String[]?} A sorted list of font families
   */
  construct : function(size, family)
  {
    this.base(arguments);

    this.__lookupMap =
    {
      fontFamily: "",
      fontSize: null,
      fontWeight: null,
      fontStyle: null,
      textDecoration: null,
      lineHeight: null,
      color: null,
      textShadow: null
    };

    if (size !== undefined) {
      this.setSize(size);
    }

    if (family !== undefined) {
      this.setFamily(family);
    }
  },




  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /**
     * Converts a typical CSS font definition string to an font object
     *
     * Example string: <code>bold italic 20px Arial</code>
     *
     * @param str {String} the CSS string
     * @return {qx.bom.Font} the created instance
     */
    fromString : function(str)
    {
      var font = new qx.bom.Font();
      var parts = str.split(/\s+/);
      var name = [];
      var part;

      for (var i=0; i<parts.length; i++)
      {
        switch(part = parts[i])
        {
          case "bold":
            font.setBold(true);
            break;

          case "italic":
            font.setItalic(true);
            break;

          case "underline":
            font.setDecoration("underline");
            break;

          default:
            var temp = parseInt(part, 10);

            if (temp == part || qx.lang.String.contains(part, "px")) {
              font.setSize(temp);
            } else {
              name.push(part);
            }

            break;
        }
      }

      if (name.length > 0) {
        font.setFamily(name);
      }

      return font;
    },


    /**
     * Converts a map property definition into a font object.
     *
     * @param config {Map} map of property values
     * @return {qx.bom.Font} the created instance
     */
    fromConfig : function(config)
    {
      var font = new qx.bom.Font;
      font.set(config);
      return font;
    },


    /** @type {Map} Default (empty) CSS styles */
    __defaultStyles :
    {
      fontFamily: "",
      fontSize: "",
      fontWeight: "",
      fontStyle: "",
      textDecoration: "",
      lineHeight: 1.2,
      color: "",
      textShadow: ""
    },


    /**
     * Returns a map of all properties in empty state.
     *
     * This is useful for resetting previously configured
     * font styles.
     *
     * @return {Map} Default styles
     */
    getDefaultStyles : function() {
      return this.__defaultStyles;
    }
  },




  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /** The font size (Unit: pixel) */
    size :
    {
      check : "Integer",
      nullable : true,
      apply : "_applySize"
    },

    /**
     * The line height as scaling factor of the default line height. A value
     * of 1 corresponds to the default line height
     */
    lineHeight :
    {
      check : "Number",
      nullable: true,
      apply : "_applyLineHeight"
    },


    /** A sorted list of font families */
    family :
    {
      check : "Array",
      nullable : true,
      apply : "_applyFamily"
    },

    /** Whether the font is bold */
    bold :
    {
      check : "Boolean",
      nullable : true,
      apply : "_applyBold"
    },

    /** Whether the font is italic */
    italic :
    {
      check : "Boolean",
      nullable : true,
      apply : "_applyItalic"
    },

    /** The text decoration for this font */
    decoration :
    {
      check : [ "underline", "line-through", "overline" ],
      nullable : true,
      apply : "_applyDecoration"
    },

    /** The text color for this font */
    color :
    {
      check : "Color",
      nullable: true,
      apply: "_applyColor"
    },

    /** The text shadow for this font */
    textShadow :
    {
      nullable : true,
      check : "String",
      apply : "_applyTextShadow"
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __lookupMap : null,


    // property apply
    _applySize : function(value, old) {
      this.__lookupMap.fontSize = value === null ? null : value + "px";
    },


    _applyLineHeight : function(value, old) {
      this.__lookupMap.lineHeight = value === null ? null : value;
    },


    // property apply
    _applyFamily : function(value, old)
    {
      var family = "";

      for (var i=0, l=value.length; i<l; i++)
      {
        // in FireFox 2 and WebKit fonts like 'serif' or 'sans-serif' must
        // not be quoted!
        if (value[i].indexOf(" ") > 0) {
          family += '"' + value[i] + '"';
        } else {
          family += value[i];
        }

        if (i !== l-1) {
          family += ",";
        }
      }

      // font family is a special case. In order to render the labels correctly
      // we have to return a font family - even if it's an empty string to prevent
      // the browser from applying the element style
      this.__lookupMap.fontFamily = family;
    },


    // property apply
    _applyBold : function(value, old) {
      this.__lookupMap.fontWeight = value == null ? null : value ? "bold" : "normal";
    },


    // property apply
    _applyItalic : function(value, old) {
      this.__lookupMap.fontStyle = value == null ? null : value ? "italic" : "normal";
    },


    // property apply
    _applyDecoration : function(value, old) {
      this.__lookupMap.textDecoration = value == null ? null : value;
    },

    // property apply
    _applyColor : function(value, old) {
      this.__lookupMap.color = null;
      if (value) {
        this.__lookupMap.color = qx.theme.manager.Color.getInstance().resolve(value);
      }
    },

    // property apply
    _applyTextShadow : function(value, old) {
      this.__lookupMap.textShadow = value == null ? null : value;
    },


    /**
     * Get a map of all CSS styles, which will be applied to the widget. Only
     * the styles which are set are returned.
     *
     * @return {Map} Map containing the current styles. The keys are property
     * names which can directly be used with the <code>set</code> method of each
     * widget.
     */
    getStyles : function() {
      return this.__lookupMap;
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)

************************************************************************ */

/**
 * Manager for font themes
 */
qx.Class.define("qx.theme.manager.Font",
{
  type : "singleton",
  extend : qx.util.ValueManager,


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /** the currently selected font theme */
    theme :
    {
      check : "Theme",
      nullable : true,
      apply : "_applyTheme",
      event : "changeTheme"
    }
  },





  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * Returns the dynamically interpreted result for the incoming value
     *
     * @param value {String} dynamically interpreted identifier
     * @return {var} return the (translated) result of the incoming value
     */
    resolveDynamic : function(value)
    {
      var dynamic = this._dynamic;
      return value instanceof qx.bom.Font ? value : dynamic[value];
    },


    /**
     * Returns the dynamically interpreted result for the incoming value,
     * (if available), otherwise returns the original value
     * @param value {String} Value to resolve
     * @return {var} either returns the (translated) result of the incoming
     * value or the value itself
     */
    resolve : function(value)
    {
      var cache = this._dynamic;
      var resolved = cache[value];

      if (resolved) {
        return resolved;
      }

      // If the font instance is not yet cached create a new one to return
      // This is true whenever a runtime include occurred (using "qx.Theme.include"
      // or "qx.Theme.patch"), since these methods only merging the keys of
      // the theme and are not updating the cache
      var theme = this.getTheme();
      if (theme !== null && theme.fonts[value])
      {
        var font = this.__getFontClass(theme.fonts[value]);
        return cache[value] = (new font).set(theme.fonts[value]);
      }

      return value;
    },


    /**
     * Whether a value is interpreted dynamically
     *
     * @param value {String} dynamically interpreted identifier
     * @return {Boolean} returns true if the value is interpreted dynamically
     */
    isDynamic : function(value)
    {
      var cache = this._dynamic;

      if (value && (value instanceof qx.bom.Font || cache[value] !== undefined))
      {
        return true;
      }

      // If the font instance is not yet cached create a new one to return
      // This is true whenever a runtime include occurred (using "qx.Theme.include"
      // or "qx.Theme.patch"), since these methods only merging the keys of
      // the theme and are not updating the cache
      var theme = this.getTheme();
      if (theme !== null && value && theme.fonts[value])
      {
        var font = this.__getFontClass(theme.fonts[value]);
        cache[value] = (new font).set(theme.fonts[value]);
        return true;
      }

      return false;
    },


    /**
     * Checks for includes and resolves them recursively
     *
     * @param fonts {Map} all fonts of the theme
     * @param fontName {String} font name to include
     */
    __resolveInclude : function(fonts, fontName)
    {
      if (fonts[fontName].include)
      {
        // get font infos out of the font theme
        var fontToInclude = fonts[fonts[fontName].include];

        // delete 'include' key - not part of the merge
        fonts[fontName].include = null;
        delete fonts[fontName].include;

        fonts[fontName] = qx.lang.Object.mergeWith(fonts[fontName], fontToInclude, false);

        this.__resolveInclude(fonts, fontName);
      }
    },


    // apply method
    _applyTheme : function(value)
    {
      var dest = this._dynamic;

      for (var key in dest)
      {
        if (dest[key].themed)
        {
          dest[key].dispose();
          delete dest[key];
        }
      }

      if (value)
      {
        var source = value.fonts;

        for (var key in source)
        {
          if (source[key].include && source[source[key].include]) {
            this.__resolveInclude(source, key);
          }

          var font = this.__getFontClass(source[key]);
          dest[key] = (new font).set(source[key]);
          dest[key].themed = true;
        }
      }
      this._setDynamic(dest);
    },

    /**
     * Decides which Font class should be used based on the theme configuration
     *
     * @param config {Map} The font's configuration map
     * @return {Class}
     */
    __getFontClass : function(config)
    {
      if (config.sources) {
        return qx.bom.webfonts.WebFont;
      }
      return qx.bom.Font;
    }
  },


  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function() {
    this._disposeMap("_dynamic");
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

************************************************************************ */

/**
 * Requests web fonts from {@link qx.bom.webfonts.Manager} and fires events
 * when their loading status is known.
 */
qx.Class.define("qx.bom.webfonts.WebFont", {

  extend : qx.bom.Font,


  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /**
     * Fired when the status of a web font has been determined. The event data
     * is a map with the keys "family" (the font-family name) and "valid"
     * (Boolean).
     */
    "changeStatus" : "qx.event.type.Data"
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /**
     * The source of the webfont.
     */
    sources :
    {
      nullable : true,
      apply : "_applySources"
    }
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __families : null,

    // property apply
    _applySources : function(value, old) {
      var families = [];

      for (var i=0, l=value.length; i<l; i++) {
        var familyName = this._quoteFontFamily(value[i].family);
        families.push(familyName);
        var sourcesList = value[i].source;
        qx.bom.webfonts.Manager.getInstance().require(familyName, sourcesList, this._onWebFontChangeStatus, this);
      }

      this.setFamily(families.concat(this.getFamily()));
    },


    /**
     * Propagates web font status changes
     *
     * @param ev {qx.event.type.Data} "changeStatus"
     */
    _onWebFontChangeStatus : function(ev)
    {
      var result = ev.getData();
      this.fireDataEvent("changeStatus", result);
      if (qx.core.Environment.get("qx.debug")) {
        if (result.valid === false) {
          this.warn("WebFont " + result.family + " was not applied, perhaps the source file could not be loaded.");
        }
      }
    },


    /**
     * Makes sure font-family names containing spaces are properly quoted
     *
     * @param familyName {String} A font-family CSS value
     * @return {String} The quoted family name
     */
    _quoteFontFamily : function(familyName)
    {
      return familyName.replace(/["']/g, "");
    }

  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

************************************************************************ */

/**
 * Manages font-face definitions, making sure that each rule is only applied
 * once.
 */
qx.Class.define("qx.bom.webfonts.Manager", {

  extend : qx.core.Object,

  type : "singleton",


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function()
  {
    this.base(arguments);
    this.__createdStyles = [];
    this.__validators = {};
    this.__queue = [];
    this.__preferredFormats = this.getPreferredFormats();
  },



  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /**
     * List of known font definition formats (i.e. file extensions). Used to
     * identify the type of each font file configured for a web font.
     */
    FONT_FORMATS : ["eot", "woff", "ttf", "svg"],

    /**
     * Timeout (in ms) to wait before deciding that a web font was not loaded.
     */
    VALIDATION_TIMEOUT : 5000
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __createdStyles : null,
    __styleSheet : null,
    __validators : null,
    __preferredFormats : null,
    __queue : null,
    __queueInterval : null,


    /*
    ---------------------------------------------------------------------------
      PUBLIC API
    ---------------------------------------------------------------------------
    */

    /**
     * Adds the necessary font-face rule for a web font to the document. Also
     * creates a web font Validator ({@link qx.bom.webfonts.Validator}) that
     * checks if the webFont was applied correctly.
     *
     * @param familyName {String} Name of the web font
     * @param sourcesList {String[]} List of source URLs. For maximum compatibility,
     * this should include EOT, WOFF and TTF versions of the font.
     * @param callback {Function?} Optional event listener callback that will be
     * executed once the validator has determined whether the webFont was
     * applied correctly.
     * See {@link qx.bom.webfonts.Validator#changeStatus}
     * @param context {Object?} Optional context for the callback function
     */
    require : function(familyName, sourcesList, callback, context)
    {
      var sources = [];
      for (var i=0,l=sourcesList.length; i<l; i++) {
        var split = sourcesList[i].split("#");
        var src = qx.util.ResourceManager.getInstance().toUri(split[0]);
        if (split.length > 1) {
          src = src + "#" + split[1];
        }
        sources.push(src);
      }

      // old IEs need a break in between adding @font-face rules
      if (qx.core.Environment.get("engine.name") == "mshtml" && (
          parseInt(qx.core.Environment.get("engine.version")) < 9) ||
          qx.core.Environment.get("browser.documentmode") < 9) {
        if (!this.__queueInterval) {
          this.__queueInterval = new qx.event.Timer(100);
          this.__queueInterval.addListener("interval", this.__flushQueue, this);
        }

        if (!this.__queueInterval.isEnabled()) {
          this.__queueInterval.start();
        }

        this.__queue.push([familyName, sources, callback, context]);
      } else {
        this.__require(familyName, sources, callback, context);
      }
    },


    /**
     * Removes a font's font-face definition from the style sheet. This means
     * the font will no longer be available and any elements using it will
     * fall back to the their regular font-families.
     *
     * @param familyName {String} font-family name
     */
    remove : function(familyName) {
      var index = null;
      for (var i=0,l=this.__createdStyles.length; i<l; i++) {
        if (this.__createdStyles[i] == familyName) {
          index = i;
          this.__removeRule(familyName);
          break;
        }
      }
      if (index) {
        qx.lang.Array.removeAt(this.__createdStyles, index);
      }
      if (familyName in this.__validators) {
        this.__validators[familyName].dispose();
        delete this.__validators[familyName];
      }
    },


    /**
     * Returns the preferred font format(s) for the currently used browser. Some
     * browsers support multiple formats, e.g. WOFF and TTF or WOFF and EOT. In
     * those cases, WOFF is considered the preferred format.
     *
     * @return {String[]} List of supported font formats ordered by preference
     * or empty Array if none could be determined
     */
    getPreferredFormats : function()
    {
      var preferredFormats = [];
      var browser = qx.core.Environment.get("browser.name");
      var browserVersion = qx.core.Environment.get("browser.version");
      var os = qx.core.Environment.get("os.name");
      var osVersion = qx.core.Environment.get("os.version");

      if ((browser == "ie" && qx.core.Environment.get("browser.documentmode") >= 9) ||
          (browser == "firefox" && browserVersion >= 3.6) ||
          (browser == "chrome" && browserVersion >= 6)) {
        preferredFormats.push("woff");
      }

      if ((browser == "opera" && browserVersion >= 10) ||
          (browser == "safari" && browserVersion >= 3.1) ||
          (browser == "firefox" && browserVersion >= 3.5) ||
          (browser == "chrome" && browserVersion >= 4) ||
          (browser == "mobile safari" && os == "ios" && osVersion >= 4.2)) {
        preferredFormats.push("ttf");
      }

      if (browser == "ie" && browserVersion >= 4) {
        preferredFormats.push("eot");
      }

      if (browser == "mobileSafari" && os == "ios" && osVersion >= 4.1) {
        preferredFormats.push("svg");
      }

      return preferredFormats;
    },


    /**
     * Removes the styleSheet element used for all web font definitions from the
     * document. This means all web fonts declared by the manager will no longer
     * be available and elements using them will fall back to their regular
     * font-families
     */
    removeStyleSheet : function()
    {
      this.__createdStyles = [];
      if (this.__styleSheet) {
        qx.bom.Stylesheet.removeSheet(this.__styleSheet);
      }
      this.__styleSheet = null;
    },



    /*
    ---------------------------------------------------------------------------
      PRIVATE API
    ---------------------------------------------------------------------------
    */

    /**
     * Does the actual work of adding stylesheet rules and triggering font
     * validation
     *
     * @param familyName {String} Name of the web font
     * @param sources {String[]} List of source URLs. For maximum compatibility,
     * this should include EOT, WOFF and TTF versions of the font.
     * @param callback {Function?} Optional event listener callback that will be
     * executed once the validator has determined whether the webFont was
     * applied correctly.
     * @param context {Object?} Optional context for the callback function
     */
    __require : function(familyName, sources, callback, context)
    {
      if (!qx.lang.Array.contains(this.__createdStyles, familyName)) {
        var sourcesMap = this.__getSourcesMap(sources);
        var rule = this.__getRule(familyName, sourcesMap);

        if (!rule) {
          throw new Error("Couldn't create @font-face rule for WebFont " + familyName + "!");
        }

        if (!this.__styleSheet) {
          this.__styleSheet = qx.bom.Stylesheet.createElement();
        }

        try {
          this.__addRule(rule);
        }
        catch(ex) {
          if (qx.core.Environment.get("qx.debug")) {
            this.warn("Error while adding @font-face rule:", ex.message);
            return;
          }
        }
        this.__createdStyles.push(familyName);
      }

      if (!this.__validators[familyName]) {
        this.__validators[familyName] = new qx.bom.webfonts.Validator(familyName);
        this.__validators[familyName].setTimeout(qx.bom.webfonts.Manager.VALIDATION_TIMEOUT);
        this.__validators[familyName].addListenerOnce("changeStatus", this.__onFontChangeStatus, this);
      }

      if (callback) {
        var cbContext = context || window;
        this.__validators[familyName].addListenerOnce("changeStatus", callback, cbContext);
      }

      this.__validators[familyName].validate();
    },


    /**
     * Processes the next item in the queue
     */
    __flushQueue : function()
    {
      if (this.__queue.length == 0) {
        this.__queueInterval.stop();
        return;
      }
      var next = this.__queue.shift();
      this.__require.apply(this, next);
    },


    /**
     * Removes the font-face declaration if a font could not be validated
     *
     * @param ev {qx.event.type.Data} qx.bom.webfonts.Validator#changeStatus
     */
    __onFontChangeStatus : function(ev)
    {
      var result = ev.getData();
      if (result.valid === false) {
        qx.event.Timer.once(function() {
          this.remove(result.family);
        }, this, 250);
      }
    },


    /**
     * Uses a naive regExp match to determine the format of each defined source
     * file for a webFont. Returns a map with the format names as keys and the
     * corresponding source URLs as values.
     *
     * @param sources {String[]} Array of source URLs
     * @return {Map} Map of formats and URLs
     */
    __getSourcesMap : function(sources)
    {
      var formats = qx.bom.webfonts.Manager.FONT_FORMATS;
      var sourcesMap = {};
      for (var i=0, l=sources.length; i<l; i++) {
        var type = null;
        for (var x=0; x < formats.length; x++) {
          var reg = new RegExp("\.(" + formats[x] + ")");
          var match = reg.exec(sources[i]);
          if (match) {
            type = match[1];
          }
        }

        if (type) {
          sourcesMap[type] = sources[i];
        }
      }
      return sourcesMap;
    },


    /**
     * Assembles the body of a font-face rule for a single webFont.
     *
     * @param familyName {String} Font-family name
     * @param sourcesMap {Map} Map of font formats and sources
     * @return {String} The computed CSS rule
     */
    __getRule : function(familyName, sourcesMap)
    {
      var rules = [];

      var formatList = this.__preferredFormats.length > 0
        ? this.__preferredFormats : qx.bom.webfonts.Manager.FONT_FORMATS;

      for (var i=0,l=formatList.length; i<l; i++) {
        var format = formatList[i];
        if (sourcesMap[format]) {
          rules.push(this.__getSourceForFormat(format, sourcesMap[format]));
        }
      }

      var rule = "src: " + rules.join(",\n") + ";";

      rule = "font-family: " + familyName + ";\n" + rule;
      rule = rule + "\nfont-style: normal;\nfont-weight: normal;";

      return rule;
    },


    /**
     * Returns the full src value for a given font URL depending on the type

     * @param format {String} The font format, one of eot, woff, ttf, svg
     * @param url {String} The font file's URL
     * @return {String} The src directive
     */
    __getSourceForFormat : function(format, url)
    {
      switch(format) {
        case "eot": return "url('" + url + "');" +
          "src: url('" + url + "?#iefix') format('embedded-opentype')";
        case "woff":
          return "url('" + url + "') format('woff')";
        case "ttf":
          return "url('" + url + "') format('truetype')";
        case "svg":
          return "url('" + url + "') format('svg')";
        default:
          return null;
      }
    },


    /**
     * Adds a font-face rule to the document
     *
     * @param rule {String} The body of the CSS rule
     */
    __addRule : function(rule)
    {
      var completeRule = "@font-face {" + rule + "}\n";

      if (qx.core.Environment.get("browser.name") == "ie" &&
          qx.core.Environment.get("browser.documentmode") < 9) {
        var cssText = this.__fixCssText(this.__styleSheet.cssText);
        cssText += completeRule;
        this.__styleSheet.cssText = cssText;
      }
      else {
        this.__styleSheet.insertRule(completeRule, this.__styleSheet.cssRules.length);
      }
    },


    /**
     * Removes the font-face declaration for the given font-family from the
     * stylesheet
     *
     * @param familyName {String} The font-family name
     */
    __removeRule : function(familyName)
    {
      var reg = new RegExp("@font-face.*?" + familyName, "m");
      for (var i=0,l=document.styleSheets.length; i<l; i++) {
        var sheet = document.styleSheets[i];
        if (sheet.cssText) {
          var cssText = sheet.cssText.replace(/\n/g, "").replace(/\r/g, "");
          cssText = this.__fixCssText(cssText);
          if (reg.exec(cssText)) {
            cssText = cssText.replace(reg, "");
          }
          sheet.cssText = cssText;
        }
        else if (sheet.cssRules) {
          for (var j=0,m=sheet.cssRules.length; j<m; j++) {
            var cssText = sheet.cssRules[j].cssText.replace(/\n/g, "").replace(/\r/g, "");
            if (reg.exec(cssText)) {
              this.__styleSheet.deleteRule(j);
              return;
            }
          }
        }
      }
    },

    /**
     * IE 6 and 7 omit the trailing quote after the format name when
     * querying cssText. This needs to be fixed before cssText is replaced
     * or all rules will be invalid and no web fonts will work any more.
     *
     * @param cssText {String} CSS text
     * @return {String} Fixed CSS text
     */
    __fixCssText : function(cssText)
    {
      return cssText.replace("'eot)", "'eot')")
        .replace("('embedded-opentype)", "('embedded-opentype')");
    }

  },

  /*
  *****************************************************************************
    DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    delete this.__createdStyles;
    this.removeStyleSheet();
    for (var prop in this.__validators) {
      this.__validators[prop].dispose();
    }
    qx.bom.webfonts.Validator.removeDefaultHelperElements();
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

************************************************************************ */

/**
 * Checks whether a given font is available on the document and fires events
 * accordingly.
 */
qx.Class.define("qx.bom.webfonts.Validator", {

  extend : qx.core.Object,


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param fontFamily {String} The name of the font to be verified
   */
  construct : function(fontFamily)
  {
    this.base(arguments);
    if (fontFamily) {
      this.setFontFamily(fontFamily);
    }
    this.__requestedHelpers = this._getRequestedHelpers();
  },



  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /**
     * Sets of serif and sans-serif fonts to be used for size comparisons.
     * At least one of these fonts should be present on any system
     */
    COMPARISON_FONTS : {
      sans : ["Arial", "Helvetica" , "sans-serif"],
      serif : ["Times New Roman", "Georgia", "serif"]
    },


    /**
     * Map of common CSS attributes to be used for all  size comparison elements
     */
    HELPER_CSS : {
      position: "absolute",
      margin: "0",
      padding: "0",
      top: "-1000px",
      left: "-1000px",
      fontSize: "350px",
      width: "auto",
      height: "auto",
      lineHeight: "normal",
      fontVariant: "normal",
      visibility: "hidden"
    },


    /**
     * The string to be used in the size comparison elements.
     */
    COMPARISON_STRING : "WEei",
    __defaultSizes : null,
    __defaultHelpers : null,


    /**
     * Removes the two common helper elements used for all size comparisons from
     * the DOM
     */
    removeDefaultHelperElements : function()
    {
      var defaultHelpers = qx.bom.webfonts.Validator.__defaultHelpers;
      if (defaultHelpers) {
        for (var prop in defaultHelpers) {
          document.body.removeChild(defaultHelpers[prop]);
        }
      }
      delete qx.bom.webfonts.Validator.__defaultHelpers;
    }
  },



  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /**
     * The font-family this validator should check
     */
    fontFamily :
    {
      nullable : true,
      init : null,
      apply : "_applyFontFamily"
    },


    /**
     * Time in milliseconds from the beginning of the check until it is assumed
     * that a font is not available
     */
    timeout :
    {
      check : "Integer",
      init : 5000
    }
  },



  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /**
     * Fired when the status of a web font has been determined. The event data
     * is a map with the keys "family" (the font-family name) and "valid"
     * (Boolean).
     */
    "changeStatus" : "qx.event.type.Data"
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __requestedHelpers : null,
    __checkTimer : null,
    __checkStarted : null,



    /*
    ---------------------------------------------------------------------------
      PUBLIC API
    ---------------------------------------------------------------------------
    */

    /**
     * Validates the font
     */
    validate : function()
    {
      this.__checkStarted = new Date().getTime();

      if (this.__checkTimer) {
        this.__checkTimer.restart();
      }
      else {
        this.__checkTimer = new qx.event.Timer(100);
        this.__checkTimer.addListener("interval", this.__onTimerInterval, this);
        // Give the browser a chance to render the new elements
        qx.event.Timer.once(function() {
          this.__checkTimer.start();
        }, this, 0);
      }
    },



    /*
    ---------------------------------------------------------------------------
      PROTECTED API
    ---------------------------------------------------------------------------
    */

    /**
     * Removes the helper elements from the DOM
     */
    _reset : function()
    {
      if (this.__requestedHelpers) {
        for (var prop in this.__requestedHelpers) {
          var elem = this.__requestedHelpers[prop];
          document.body.removeChild(elem);
        }
        this.__requestedHelpers = null;
      }
    },


    /**
     * Checks if the font is available by comparing the widths of the elements
     * using the generic fonts to the widths of the elements using the font to
     * be validated
     *
     * @return {Boolean} Whether or not the font caused the elements to differ
     * in size
     */
    _isFontValid : function()
    {
      if (!qx.bom.webfonts.Validator.__defaultSizes) {
        this.__init();
      }

      if (!this.__requestedHelpers) {
        this.__requestedHelpers = this._getRequestedHelpers();
      }

      var requestedSans = qx.bom.element.Dimension.getWidth(this.__requestedHelpers.sans);
      var requestedSerif = qx.bom.element.Dimension.getWidth(this.__requestedHelpers.serif);

      var cls = qx.bom.webfonts.Validator;
      if (requestedSans !== cls.__defaultSizes.sans &&
          requestedSerif !== cls.__defaultSizes.serif)
      {
        return true;
      }
      return false;
    },


    /**
     * Creates the two helper elements styled with the font to be checked
     *
     * @return {Map} A map with the keys <pre>sans</pre> and <pre>serif</pre>
     * and the created span elements as values
     */
    _getRequestedHelpers : function()
    {
      var fontsSans = [this.getFontFamily()].concat(qx.bom.webfonts.Validator.COMPARISON_FONTS.sans);
      var fontsSerif = [this.getFontFamily()].concat(qx.bom.webfonts.Validator.COMPARISON_FONTS.serif);
      return {
        sans : this._getHelperElement(fontsSans),
        serif : this._getHelperElement(fontsSerif)
      }
    },


    /**
     * Creates a span element with the comparison text ({@link #COMPARISON_STRING})
     * and styled with the default CSS ({@link #HELPER_CSS}) plus the given
     * font-family value and appends it to the DOM
     *
     * @param fontFamily {String} font-family string
     * @return {Element} the created DOM element
     */
    _getHelperElement : function(fontFamily)
    {
      var styleMap = qx.lang.Object.clone(qx.bom.webfonts.Validator.HELPER_CSS);
      if (fontFamily) {
        if (styleMap.fontFamily) {
          styleMap.fontFamily += "," + fontFamily.join(",");
        }
        else {
          styleMap.fontFamily = fontFamily.join(",");
        }
      }

      var elem = document.createElement("span");
      elem.innerHTML = qx.bom.webfonts.Validator.COMPARISON_STRING;
      qx.bom.element.Style.setStyles(elem, styleMap);
      document.body.appendChild(elem);
      return elem;
    },


    // property apply
    _applyFontFamily : function(value, old)
    {
      if (value !== old) {
        this._reset();
      }
    },



    /*
    ---------------------------------------------------------------------------
      PRIVATE API
    ---------------------------------------------------------------------------
    */

    /**
     * Creates the default helper elements and gets their widths
     */
    __init : function()
    {
      var cls = qx.bom.webfonts.Validator;
      if (!cls.__defaultHelpers) {
        cls.__defaultHelpers = {
          sans : this._getHelperElement(cls.COMPARISON_FONTS.sans),
          serif : this._getHelperElement(cls.COMPARISON_FONTS.serif)
        };
      }

      cls.__defaultSizes = {
        sans : qx.bom.element.Dimension.getWidth(cls.__defaultHelpers.sans),
        serif: qx.bom.element.Dimension.getWidth(cls.__defaultHelpers.serif)
      }
    },


    /**
     * Triggers helper element size comparison and fires a ({@link #changeStatus})
     * event with the result.
     */
    __onTimerInterval : function()
    {
      if (this._isFontValid()) {
        this.__checkTimer.stop();
        this._reset();
        this.fireDataEvent("changeStatus", {
          family : this.getFontFamily(),
          valid : true
        });
      }
      else
      {
        var now = new Date().getTime();
        if (now - this.__checkStarted >= this.getTimeout()) {
          this.__checkTimer.stop();
          this._reset();
          this.fireDataEvent("changeStatus", {
            family : this.getFontFamily(),
            valid : false
          });
        }
      }
    }

  },



  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    this._reset();
    this.__checkTimer.stop();
    this.__checkTimer.removeListener("interval", this.__onTimerInterval, this);
    this._disposeObjects("__checkTimer");
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * This interface defines the necessary features a form renderer should have.
 * Keep in mind that all renderes has to be widgets.
 */
qx.Interface.define("qx.ui.form.renderer.IFormRenderer",
{
  members :
  {
    /**
     * Add a group of form items with the corresponding names. The names should
     * be displayed as hint for the user what to do with the form item.
     * The title is optional and can be used as grouping for the given form
     * items.
     *
     * @param items {qx.ui.core.Widget[]} An array of form items to render.
     * @param names {String[]} An array of names for the form items.
     * @param title {String?} A title of the group you are adding.
     * @param itemsOptions {Array?null} The added additional data.
     * @param headerOptions {Map?null} The options map as defined by the form
     *   for the current group header.
     */
    addItems : function(items, names, title, itemsOptions, headerOptions) {},


    /**
     * Adds a button the form renderer.
     *
     * @param button {qx.ui.form.Button} A button which should be added to
     *   the form.
     * @param options {Map?null} The added additional data.
     */
    addButton : function(button, options) {}

  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Gabriel Munteanu (gabios)

************************************************************************ */

/**
 * AbstractRenderer is an abstract class used to encapsulate
 * behaviours of how a form can be rendered into a mobile page.
 * Its subclasses can extend it and override {@link #addItems} and {@link #addButton}
 * methods in order to customize the way the form gets into the DOM.
 *
 *
 */
qx.Class.define("qx.ui.mobile.form.renderer.AbstractRenderer",
{
  type : "abstract",
  extend : qx.ui.mobile.core.Widget,
  implement : qx.ui.form.renderer.IFormRenderer,

  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param form {qx.ui.mobile.form.Form} The form to be rendered
   */
  construct : function(form)
  {
    this.base(arguments);

    // add the groups
    var groups = form.getGroups();
    for (var i = 0; i < groups.length; i++)
    {
      var group = groups[i];
      this.addItems(
        group.items, group.labels, group.title, group.options, group.headerOptions
      );
    }

    // add the buttons
    var buttons = form.getButtons();
    var buttonOptions = form.getButtonOptions();
    for (var i = 0; i < buttons.length; i++) {
      this.addButton(buttons[i], buttonOptions[i]);
    }
    form.setRenderer(this);

    this._form = form;
  },

  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    // overridden
    defaultCssClass :
    {
      refine : true,
      init : "form"
    }
  },

  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

   members :
  {

    _form : null,


    // interface implementation
    addItems : function(items, names, title) {
      throw new Error("Abstract method call");
    },


    // interface implementation
    addButton : function(button) {
      throw new Error("Abstract method call");
    },

    /**
     * Shows an error to the user when a form element is in invalid state
     * usually it prints an error message, so that user can rectify the filling of the form element.
     * @param item {qx.ui.mobile.core.Widget} the form item
     */
    showErrorForItem : function(item) {
      throw new Error("Abstract method call");
    },

    /**
     *
     * Resets the errors for the form by removing any error messages
     * inserted into DOM in the case of invalid form elements
     *
     */
    resetForm : function() {
      throw new Error("Abstract method call");
    }
  }

});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Tino Butz (tbtz)
     * Christopher Zuendorf (czuendorf)

************************************************************************ */

/**
 * A toggle Button widget
 *
 * If the user tap the button, the button toggles between the <code>ON</code>
 * and <code>OFF</code> state.
 *
 * Here is a little example of how to use the widget.
 *
 * <pre class='javascript'>
 *   var button = new qx.ui.mobile.form.ToggleButton(false,"YES","NO");
 *
 *   button.addListener("changeValue", function(e) {
 *     alert(e.getData());
 *   }, this);
 *
 *   this.getRoot.add(button);
 * </pre>
 *
 * This example creates a toggle button and attaches an
 * event listener to the {@link #changeValue} event.
 */
qx.Class.define("qx.ui.mobile.form.ToggleButton",
{
  extend : qx.ui.mobile.core.Widget,
  include : [
    qx.ui.mobile.form.MValue,
    qx.ui.form.MForm,
    qx.ui.form.MModelProperty,
    qx.ui.mobile.form.MState
  ],
  implement : [
    qx.ui.form.IForm,
    qx.ui.form.IModel
  ],

  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param value {Boolean?null} The value of the button
   * @param labelChecked {Boolean?"ON"} The value of the text display when toggleButton is active
   * @param labelUnchecked {Boolean?"OFF"} The value of the text display when toggleButton is inactive
   */
  construct : function(value, labelChecked, labelUnchecked)
  {
    this.base(arguments);

    if(labelChecked && labelUnchecked) {
       this.__labelUnchecked = labelUnchecked;
       this.__labelChecked = labelChecked;
    }

    this._setAttribute("data-label-checked", this.__labelChecked);
    this._setAttribute("data-label-unchecked", this.__labelUnchecked);

    this.__switch = this._createSwitch();
    this._add(this.__switch);

    if (value) {
      this.setValue(value);
    }

    this.addListener("tap", this._onTap, this);
    this.addListener("swipe", this._onSwipe, this);
    this.addListener("touchmove", this._onTouch, this);

  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    // overridden
    defaultCssClass :
    {
      refine : true,
      init : "toggleButton"
    }
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __switch : null,
    __value : false,
    __labelUnchecked : "OFF",
    __labelChecked : "ON",
    __lastToggleTimestamp : 0,


    /**
     * Returns the child control of the toggle button.
     *
     * @return {qx.ui.mobile.container.Composite} the child control.
     */
    _getChild : function() {
      return this.__switch;
    },


    /**
     * Creates the switch control of the widget.
     * @return {qx.ui.mobile.container.Composite} The switch control.
     */
    _createSwitch : function() {
      var toggleButtonSwitch = new qx.ui.mobile.container.Composite();
      toggleButtonSwitch.addCssClass("toggleButtonSwitch");
      return toggleButtonSwitch;
    },


    /**
     * Sets the value [true/false] of this toggle button.
     * It is called by setValue method of qx.ui.mobile.form.MValue mixin
     * @param value {Boolean} the new value of the toggle button
     */
    _setValue : function(value)
    {
      if(typeof value !== 'boolean') {
        throw new Error("value for "+this+" should be boolean");
      }
      if (value) {
        this.addCssClass("checked");
      } else {
        this.removeCssClass("checked");
      }
       this.__value = value;
    },

    /**
     * Gets the value [true/false] of this toggle button.
     * It is called by getValue method of qx.ui.mobile.form.MValue mixin
     * @return {Boolean} the value of the toggle button
     */
    _getValue : function() {
      return this.__value;
    },


    /**
     * Toggles the value of the button.
     */
    toggle : function() {
        this.setValue(!this.getValue());
    },


    /**
     * Event handler. Called when the tap event occurs.
     * Toggles the button.
     *
     * @param evt {qx.event.type.Tap} The tap event.
     */
    _onTap : function(evt)
    {
      if(this._checkLastTouchTime()) {
        this.toggle();
      }
    },


     /**
     * Event handler. Called when the touchmove event occurs.
     * Prevents bubbling, because on swipe no scrolling of outer container is wanted.
     *
     * @param evt {qx.event.type.Touch} The touch event.
     */
    _onTouch : function(evt) {
      evt.stopPropagation();
    },


    /**
     * Event handler. Called when the swipe event occurs.
     * Toggles the button, when.
     *
     * @param evt {qx.event.type.Swipe} The swipe event.
     */
    _onSwipe : function(evt)
    {
      if (this._checkLastTouchTime()) {
        var direction = evt.getDirection();
        if (direction == "left") {
          if (this.__value == true) {
            this.toggle();
          }
        } else {
          if (this.__value == false) {
            this.toggle();
          }
        }
      }
    },


    /**
     * Checks if last touch event (swipe,tap) is more than 500ms ago.
     * Bugfix for several simulator/emulator, when tap is immediately followed by a swipe.
     * @return {Boolean} <code>true</code> if the last event was more than 500ms ago
     */
    _checkLastTouchTime : function() {
      var elapsedTime = new Date().getTime() - this.__lastToggleTimestamp;
      this.__lastToggleTimestamp = new Date().getTime();
      return elapsedTime>500;
    }
  },


 /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    this.removeListener("tap", this._onTap, this);
    this.removeListener("swipe", this._onSwipe, this);

    this._disposeObjects("__switch","__labelUnchecked","__labelChecked");
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2013 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Tino Butz (tbtz)
     * Christopher Zuendorf (czuendorf)

************************************************************************ */

/**
 * The Checkbox is the mobile correspondent of the html checkbox.
 *
 * *Example*
 *
 * <pre class='javascript'>
 *   var checkBox = new qx.ui.mobile.form.CheckBox();
 *   var title = new qx.ui.mobile.form.Title("Title");
 *
 *   checkBox.setModel("Title Activated");
 *   checkBox.bind("model", title, "value");
 *
 *   checkBox.addListener("changeValue", function(evt){
 *     this.setModel(evt.getdata() ? "Title Activated" : "Title Deactivated");
 *   });
 *
 *   this.getRoot.add(checkBox);
 *   this.getRoot.add(title);
 * </pre>
 *
 * This example adds 2 widgets , a checkBox and a Title and binds them together by their model and value properties.
 * When the user taps on the checkbox, its model changes and it is reflected in the Title's value.
 *
 */
qx.Class.define("qx.ui.mobile.form.CheckBox",
{
  extend : qx.ui.mobile.form.Input,
  include : [qx.ui.mobile.form.MValue],

  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param value {Boolean?false} The value of the checkbox.
   */
  construct : function(value)
  {
    this.base(arguments);

    if(typeof value != undefined) {
      this._state = value;
    }

    this.addListener("tap", this._onTap, this);
  },

  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    // overridden
    defaultCssClass :
    {
      refine : true,
      init : "checkbox"
    }

  },

  members :
  {
    _state : null,


    // overridden
    _getTagName : function()
    {
      return "span";
    },


    // overridden
    _getType : function()
    {
      return null;
    },


    /**
     * Handler for tap events.
     */
    _onTap : function() {
      // Toggle State.
      this.setValue(!this.getValue());
    },


    /**
     * Sets the value [true/false] of this checkbox.
     * It is called by setValue method of qx.ui.mobile.form.MValue mixin
     * @param value {Boolean} the new value of the checkbox
     */
    _setValue : function(value) {
      if(value == true) {
        this.addCssClass("checked");
      } else {
        this.removeCssClass("checked");
      }

      this._setAttribute("checked", value);

      this._state = value;
    },


    /**
     * Gets the value [true/false] of this checkbox.
     * It is called by getValue method of qx.ui.mobile.form.MValue mixin
     * @return {Boolean} the value of the checkbox
     */
    _getValue : function() {
      return this._state;
    }
  },


  /*
  *****************************************************************************
      DESTRUCTOR
  *****************************************************************************
  */
  destruct : function()
  {
    this.removeListener("tap", this._onTap, this);
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Tino Butz (tbtz)

************************************************************************ */

/**
 * The PasswordField is a single-line password input field.
 */
qx.Class.define("qx.ui.mobile.form.PasswordField",
{
  extend : qx.ui.mobile.form.TextField,


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    // overridden
    defaultCssClass :
    {
      refine : true,
      init : "password-field"
    }
  },

  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    // overridden
    _getType : function()
    {
      return "password";
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Gabriel Munteanu (gabios)
     * Christopher Zuendorf (czuendorf)

************************************************************************ */

/**
 * The Radio button for mobile.
 *
 * *Example*
 *
 * <pre class='javascript'>
 *    var form = new qx.ui.mobile.form.Form();
 *
 *    var radio1 = new qx.ui.mobile.form.RadioButton();
 *    var radio2 = new qx.ui.mobile.form.RadioButton();
 *    var radio3 = new qx.ui.mobile.form.RadioButton();
 *
 *    var group = new qx.ui.mobile.form.RadioGroup(radio1, radio2, radio3);

 *    form.add(radio1, "Germany");
 *    form.add(radio2, "UK");
 *    form.add(radio3, "USA");
 *
 *    this.getRoot.add(new qx.ui.mobile.form.renderer.Single(form));
 * </pre>
 *
 *
 */
qx.Class.define("qx.ui.mobile.form.RadioButton",
{
  extend : qx.ui.mobile.form.Input,
  include : [qx.ui.mobile.form.MValue],

  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param value {Boolean?null} The value of the checkbox.
   */
  construct : function(value)
  {
    this.base(arguments);
    this.addListener("tap", this._onTap, this);
  },


  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */
  events :
  {
    /**
     * Fired when the selection value is changed.
     */
    changeValue : "qx.event.type.Data"
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */
  properties :
  {
    // overridden
    defaultCssClass :
    {
      refine : true,
      init : "radio"
    },


    /** The assigned qx.ui.form.RadioGroup which handles the switching between registered buttons */
    group :
    {
      check  : "qx.ui.mobile.form.RadioGroup",
      nullable : true,
      apply : "_applyGroup"
    }
  },


  members :
  {
    _state : null,

    // overridden
    _getTagName : function()
    {
      return "span";
    },


    // overridden
    _getType : function()
    {
      return null;
    },


    /**
     * Reacts on tap on radio button.
     */
    _onTap : function() {
      this.fireDataEvent("changeValue", {});

      // Toggle State.
      this.setValue(true);
    },


    /**
     * The assigned {@link qx.ui.form.RadioGroup} which handles the switching between registered buttons
     * @param value {qx.ui.form.RadioGroup} the new radio group to which this radio button belongs.
     * @param old {qx.ui.form.RadioGroup} the old radio group of this radio button.
     */
    _applyGroup : function(value, old)
    {
      if (old) {
        old.remove(this);
      }

      if (value) {
        value.add(this);
      }
    },


    /**
     * Sets the value [true/false] of this radio button.
     * It is called by setValue method of qx.ui.mobile.form.MValue mixin
     * @param value {Boolean} the new value of the radio button
     */
    _setValue : function(value) {
      if(value == true) {
        this.addCssClass("checked");
      } else {
        this.removeCssClass("checked");
      }

      this._state = value;
    },


    /**
     * Gets the value [true/false] of this radio button.
     * It is called by getValue method of qx.ui.mobile.form.MValue mixin
     * @return {Boolean} the value of the radio button
     */
    _getValue : function() {
      return this._state;
    }
  },


  /*
  *****************************************************************************
      DESTRUCTOR
  *****************************************************************************
  */
  destruct : function()
  {
    qx.event.Registration.removeListener(this, "tap", this._onTap, this);
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Gabriel Munteanu (gabios)
     * Christopher Zuendorf (czuendorf)

************************************************************************ */

/**
 * The SelectBox
 *
 * an example, how to use the SelectBox:
 * *Example*
 *
 * <pre class='javascript'>
 *    var page1 = new qx.ui.mobile.page.Page();
 *    page1.addListener("initialize", function()
 *    {
 *      var sel = new qx.ui.mobile.form.SelectBox();
 *      page1.add(sel);
 *      var model = new qx.data.Array(["item1","item2"]);
 *      sel.setModel(model);
 *      model.push("item3");
 *
 *      var but = new qx.ui.mobile.form.Button("setSelection");
 *      page1.add(but);
 *      but.addListener("tap", function(){
 *        sel.setSelection("item3");
 *      }, this);
 *
 *      sel.addListener("changeSelection", function(evt) {
 *        console.log(evt.getData());
 *      }, this);
 *
 *      var title = new qx.ui.mobile.form.Title("item2");
 *      title.bind("value",sel,"value");
 *      sel.bind("value",title,"value");
 *      page1.add(title);
 *   },this);
 *
 *   page1.show();
 *  </pre>
 */
qx.Class.define("qx.ui.mobile.form.SelectBox",
{
  extend : qx.ui.mobile.core.Widget,
  include : [
    qx.ui.mobile.form.MValue,
    qx.ui.form.MForm,
    qx.ui.mobile.form.MText,
    qx.ui.mobile.form.MState
  ],
  implement : [
    qx.ui.form.IForm,
    qx.ui.form.IModel
  ],


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */
  construct : function()
  {
    this.base(arguments);

    // This text node is for compatibility reasons, because Firefox can not
    // change appearance of SelectBoxes.
    this._setAttribute("type","text");
    this.setReadOnly(true);

    this.addListener("focus", this.blur);
    this.addListener("tap", this._onTap, this);

    // Selection dialog creation.
    this.__selectionDialog = this._createSelectionDialog();

    // When selectionDialogs changes selection, get chosen selectedIndex from it.
    this.__selectionDialog.addListener("changeSelection", this._onChangeSelection, this);
  },


  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */
  events :
  {
    /**
     * Fired when user selects an item.
     */
    changeSelection : "qx.event.type.Data"
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {

    // overridden
    defaultCssClass :
    {
      refine : true,
      init : "selectbox"
    },


    // overridden
    activatable :
    {
      refine :true,
      init : true
    },


    /**
     * Defines if the SelectBox has a clearButton, which resets the selection.
     */
    nullable :
    {
      init : true,
      check : "Boolean",
      apply : "_applyNullable"
    },


    /**
     * The model to use to render the list.
     */
    model :
    {
      check : "qx.data.Array",
      apply : "_applyModel",
      event : "changeModel",
      nullable : true,
      init : null
    },


    /**
     * The selected index of this SelectBox.
     */
    selection :
    {
      init : null,
      validate : "_validateSelection",
      apply : "_applySelection",
      nullable : true
    }
  },


  members :
  {
    __selectionDialog : null,


    // overridden
    _getTagName : function()
    {
      // No select here, see BUG #6054
      return "input";
    },


    // overridden
    _createContainerElement : function()
    {
      var containerElement = this.base(arguments);

      var showSelectionDialog = qx.lang.Function.bind(this.__showSelectionDialog, this);
      qx.bom.Event.addNativeListener(containerElement, "click", showSelectionDialog, false);
      qx.bom.Event.addNativeListener(containerElement, "touchend", showSelectionDialog, false);

      qx.bom.Event.addNativeListener(containerElement, "click", qx.bom.Event.preventDefault, false);
      qx.bom.Event.addNativeListener(containerElement, "touchstart", qx.bom.Event.preventDefault, false);

      return containerElement;
    },


    /**
     * Creates the menu dialog. Override this to customize the widget.
     *
     * @return {qx.ui.mobile.dialog.Menu} A dialog, containing a selection list.
     */
    _createSelectionDialog : function() {
      var menu = new qx.ui.mobile.dialog.Menu();

      // Special appearance for SelectBox menu items.
      menu.setSelectedItemClass("selectbox-selected");
      menu.setUnselectedItemClass("selectbox-unselected");

      // Hide selectionDialog on tap on blocker.
      menu.setHideOnBlockerClick(true);

      return menu;
    },


    /**
     * Returns the SelectionDialog.
     * @return {qx.ui.mobile.dialog.Menu} the SelectionDialog.
     */
    getSelectionDialog : function() {
      return this.__selectionDialog;
    },


    /**
     * Sets the dialog title on the selection dialog.
     * @param title {String} the title to set on selection dialog.
     */
    setDialogTitle : function(title) {
      this.__selectionDialog.setTitle(title);
    },


    /**
     * Set the ClearButton label of the selection dialog.
     * @param value {String} the value to set on the ClearButton at selection dialog.
     */
    setClearButtonLabel : function(value) {
      this.__selectionDialog.setClearButtonLabel(value);
    },


    /**
     * Sets the selected text value of this SelectBox.
     * @param value {String} the text value which should be selected.
     */
    _setValue : function(value) {
      if(this.getModel() == null) {
        return;
      }

      if (value == "") {
        if (this.isNullable()) {
          this.setSelection(null);
        } else {
          this.setSelection(0);
        }
      } else if (value != null) {
        this.setSelection(this.getModel().indexOf(value));
      } else {
        this.setSelection(null);
      }
    },


    /**
     * Get the text value of this
     * It is called by setValue method of qx.ui.mobile.form.MValue mixin.
     * @return {Number} the new selected index of the SelectBox.
     */
    _getValue : function() {
      return this._getAttribute("value");
    },


    /**
     * Renders this SelectBox. Override this if you would like to display the
     * values of the SelectBox in a different way than the default.
     */
    _render : function() {
      if(this.getModel() != null && this.getModel().length > 0) {
        var selectedItem = this.getModel().getItem(this.getSelection());
        this._setAttribute("value", selectedItem);
      }

      this._domUpdated();
    },


    /**
     * Sets the model property to the new value
     * @param value {qx.data.Array}, the new model
     * @param old {qx.data.Array?}, the old model
     */
    _applyModel : function(value, old){
      value.addListener("change", this._render, this);
      if (old != null) {
        old.removeListener("change", this._render, this);
      }

      this._render();
    },


    /**
     * Refreshs selection dialogs model, and shows it.
     */
    __showSelectionDialog : function () {
      if(this.isEnabled() == true) {
        // Set index before items, because setItems() triggers rendering.
        this.__selectionDialog.setSelectedIndex(this.getSelection());
        this.__selectionDialog.setItems(this.getModel());
        this.__selectionDialog.show();
      }
    },


    /**
     * Gets the selectedIndex out of change selection event and renders view.
     * @param evt {qx.event.type.Data} data event.
     */
    _onChangeSelection : function (evt) {
      this.setSelection(evt.getData().index);
      this._render();
    },


    /**
    * Handler for <code>tap</code> event on this widget.
    * @param evt {qx.event.type.Tap} the handling tap event. 
    */
    _onTap : function(evt) {
      // request focus so that it leaves previous widget
      // such as text field and hide virtual keyboard.
      evt.getOriginalTarget().focus();
    },


    /**
     * Validates the selection value.
     * @param value {Integer} the selection value to validate.
     */
    _validateSelection : function(value) {
      if(value != null && qx.lang.Type.isNumber(value) == false)
      {
        throw new qx.core.ValidationError(
          "Validation Error: Input value is not a number"
        );
      }

      if(this.getModel() === null) {
        throw new qx.core.ValidationError(
          "Validation Error: Please apply model before selection"
        );
      }

      if(!this.isNullable() && value === null ) {
        throw new qx.core.ValidationError(
          "Validation Error: SelectBox is not nullable"
        );
      }

      if(value != null && (value < 0 || value >= this.getModel().getLength())) {
        throw new qx.core.ValidationError(
          "Validation Error: Input value is out of model range"
        );
      }
    },


    // property apply
    _applySelection : function(value, old) {
      var selectedItem = this.getModel().getItem(value);
      this.fireDataEvent("changeSelection", {index: value, item: selectedItem});

      this._render();
    },


    // property apply
    _applyNullable : function(value, old) {
      // Delegate nullable property.
      this.__selectionDialog.setNullable(value);
    }
  },

  /*
  *****************************************************************************
      DESTRUCTOR
  *****************************************************************************
  */
  destruct : function()
  {
    this.__selectionDialog.removeListener("changeSelection", this._onChangeSelection, this);

    this._disposeObjects("__selectionDialog","__selectionDialogTitle");

    this.removeListener("focus", this.blur);
    this.removeListener("tap", this._onTap, this);
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Gabriel Munteanu (gabios)
     * Christopher Zuendorf (czuendorf)

************************************************************************ */

/**
 * The popup represents a widget that gets shown above other widgets,
 * usually to present more info/details regarding an item in the application.
 *
 * There are 3 usages for now:
 *
 * <pre class='javascript'>
 * var widget = new qx.ui.mobile.form.Button("Error!");
 * var popup = new qx.ui.mobile.dialog.Popup(widget);
 * popup.show();
 * </pre>
 * Here we show a popup consisting of a single buttons alerting the user
 * that an error has occured.
 * It will be centered to the screen.
 * <pre class='javascript'>
 * var label = new qx.ui.mobile.basic.Label("Item1");
 * var widget = new qx.ui.mobile.form.Button("Error!");
 * var popup = new qx.ui.mobile.dialog.Popup(widget, label);
 * popup.show();
 * widget.addListener("tap", function(){
 *   popup.hide();
 * });
 *
 * </pre>
 *
 * In this case everything is as above, except that the popup will get shown next to "label"
 * so that the user can understand that the info presented is about the "Item1"
 * we also add a tap listener to the button that will hide out popup.
 *
 * Once created, the instance is reused between show/hide calls.
 *
 * <pre class='javascript'>
 * var widget = new qx.ui.mobile.form.Button("Error!");
 * var popup = new qx.ui.mobile.dialog.Popup(widget);
 * popup.placeTo(25,100);
 * popup.show();
 * </pre>
 *
 * Same as the first example, but this time the popup will be shown at the 25,100 coordinates.
 *
 *
 */
qx.Class.define("qx.ui.mobile.dialog.Popup",
{
  extend : qx.ui.mobile.core.Widget,


  statics:
  {
    ROOT : null
  },


  /**
   * @param widget {qx.ui.mobile.core.Widget} the widget the will be shown in the popup
   * @param anchor {qx.ui.mobile.core.Widget?} optional parameter, a widget to attach this popup to
   */
  construct : function(widget, anchor)
  {
    this.base(arguments);
    this.exclude();

    if(qx.ui.mobile.dialog.Popup.ROOT == null) {
      qx.ui.mobile.dialog.Popup.ROOT = qx.core.Init.getApplication().getRoot();
    }
    qx.ui.mobile.dialog.Popup.ROOT.add(this);

    this.__anchor = anchor;

    if(widget) {
      this._initializeChild(widget);
    }
  },


  properties :
  {
    // overridden
    defaultCssClass :
    {
      refine : true,
      init : "popup"
    },


    /**
     * The label/caption/text of the qx.ui.mobile.basic.Atom instance
     */
    title :
    {
      apply : "_applyTitle",
      nullable : true,
      check : "String",
      event : "changeTitle"
    },


    /**
     * Any URI String supported by qx.ui.mobile.basic.Image to display an icon
     */
    icon :
    {
      check : "String",
      apply : "_applyIcon",
      nullable : true,
      event : "changeIcon"
    },


    /**
     * Whether the popup should be displayed modal.
     */
    modal :
    {
      init : false,
      check : "Boolean",
      nullable: false
    },


    /**
     * Indicates whether the a modal popup should disappear when user taps/clicks on Blocker.
     */
    hideOnBlockerClick :
    {
      check : "Boolean",
      init : false
    }
  },


  members :
  {
    __isShown : false,
    __childrenContainer : null,
    __percentageTop : null,
    __anchor: null,
    __widget: null,
    __titleWidget: null,
    __lastPopupDimension : null,


    /**
     * Event handler. Called whenever the position of the popup should be updated.
     */
    _updatePosition : function()
    {
      this.removeCssClasses(['top', 'bottom', 'left', 'right', 'anchor']);

      if(this.__anchor)
      {
        this.addCssClass('anchor');

        var rootHeight = qx.ui.mobile.dialog.Popup.ROOT.getHeight();
        var rootWidth = qx.ui.mobile.dialog.Popup.ROOT.getWidth();

        var rootPosition = qx.bom.element.Location.get(qx.ui.mobile.dialog.Popup.ROOT.getContainerElement());
        var anchorPosition = qx.bom.element.Location.get(this.__anchor.getContainerElement());
        var popupDimension = qx.bom.element.Dimension.getSize(this.getContainerElement());

        this.__lastPopupDimension = popupDimension;

        var computedPopupPosition = qx.util.placement.Placement.compute(popupDimension, {
          width: rootPosition.left + rootWidth,
          height: rootPosition.top + rootHeight
        }, anchorPosition, {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        }, "bottom-left", "keep-align", "keep-align");

        // Reset Anchor.
        this._resetPosition();

        var isTop = anchorPosition.top > computedPopupPosition.top;
        var isLeft = anchorPosition.left > computedPopupPosition.left;

        computedPopupPosition.top = computedPopupPosition.top - rootPosition.top;
        computedPopupPosition.left = computedPopupPosition.left - rootPosition.left;

        var isOutsideViewPort = computedPopupPosition.top < 0
          || computedPopupPosition.left < 0
          || computedPopupPosition.left + popupDimension.width > rootWidth
          || computedPopupPosition.top + popupDimension.height > rootHeight;

        if(isOutsideViewPort) {
          this._positionToCenter();
        } else {
          if (isTop) {
            this.addCssClass('bottom');
          } else {
            this.addCssClass('top');
          }
          if (isLeft) {
            this.addCssClass('right');
          } else {
            this.addCssClass('left');
          }

          this.placeTo(computedPopupPosition.left, computedPopupPosition.top);
        }
      } else if (this.__childrenContainer) {
        // No Anchor
        this._positionToCenter();
      }
    },


    /**
     * This method shows the popup.
     * First it updates the position, then registers the event handlers, and shows it.
     */
    show : function()
    {
      if (!this.__isShown)
      {
        this.__registerEventListener();

        // Move outside of viewport
        this.placeTo(-1000,-1000);

        // Needs to be added to screen, before rendering position, for calculating
        // objects height.
        this.base(arguments);

        // Now render position.
        this._updatePosition();
      }
      this.__isShown = true;

      if(this.getModal() === true)
      {
        qx.ui.mobile.core.Blocker.getInstance().show();

        if(this.getHideOnBlockerClick()) {
          qx.ui.mobile.core.Blocker.getInstance().addListener("tap", this.hide, this);
        }
      }
    },


    /**
     * Hides the popup.
     */
    hide : function()
    {
      if (this.__isShown)
      {
        this.__unregisterEventListener();

        this.exclude();
      }
      this.__isShown = false;

      if(this.getModal())
      {
        qx.ui.mobile.core.Blocker.getInstance().hide();
      }

      qx.ui.mobile.core.Blocker.getInstance().removeListener("tap", this.hide, this);
    },


    /**
     * Hides the popup after a given time delay.
     * @param delay {Integer} time delay in ms.
     */
    hideWithDelay : function(delay) {
      if (delay) {
        qx.lang.Function.delay(this.hide, delay, this);
      } else {
        this.hide();
      }
    },


    /**
     * Returns the shown state of this popup.
     * @return {Boolean} whether the popup is shown or not.
     */
    isShown : function() {
      return this.__isShown;
    },


    /**
     * Toggles the visibility of this popup.
     */
    toggleVisibility : function() {
      if(this.__isShown == true) {
        this.hide();
      } else {
        this.show();
      }
    },


    /**
     * This method positions the popup widget at the coordinates specified.
     * @param left {Integer} - the value the will be set to container's left style property
     * @param top {Integer} - the value the will be set to container's top style property
     */
    placeTo : function(left, top)
    {
      this._setStyle("left",left+"px");
      this._setStyle("top",top+"px");
    },


    /**
     * Tracks the user touch on root and hides the widget if touch start event
     * occurs outside of the widgets bounds.
     * @param evt {qx.event.type.Touch} the touch event.
     */
    _trackUserTouch : function(evt) {
      var clientX = evt.getAllTouches()[0].clientX;
      var clientY = evt.getAllTouches()[0].clientY;

      var popupLocation = qx.bom.element.Location.get(this.getContainerElement());

      var isOutsideWidget =  clientX < popupLocation.left
        || clientX > popupLocation.left + this.__lastPopupDimension.width
        || clientY > popupLocation.top + this.__lastPopupDimension.height
        || clientY < popupLocation.top;

      if(isOutsideWidget) {
        this.hide();
      }
    },


    /**
     * Handler for touchstart events on popup. Prevents default of <code>touchstart</code>
     * if originalTarget was not of type {@link qx.ui.mobile.form.Input qx.ui.mobile.form.Input} or
     * {@link qx.ui.mobile.form.TextArea qx.ui.mobile.form.TextArea}
     * @param evt {qx.event.type.Touch} The touch event.
     */
    _preventTouch : function(evt) {
      var originalTargetWidget = qx.ui.mobile.core.Widget.getWidgetById(evt.getOriginalTarget().id);
      if (!(originalTargetWidget instanceof qx.ui.mobile.form.Input)
          && !(originalTargetWidget instanceof qx.ui.mobile.form.TextArea)) {
        evt.preventDefault();
      }
    },


    /**
     * Centers this widget to window's center position.
     */
    _positionToCenter : function()
    {
      var container = this.getContainerElement();
      container.style.position = "absolute";
      container.style.marginLeft = -(container.offsetWidth/2) + "px";
      container.style.marginTop = -(container.offsetHeight/2) + "px";
      container.style.left = "50%";
      container.style.top = "50%";
    },


    /**
     * Resets the position of this element (left, top, margins...)
     */
    _resetPosition : function()
    {
      var container = this.getContainerElement();
      container.style.left = "0px";
      container.style.top = "0px";
      container.style.marginLeft = null;
      container.style.marginTop = null;
    },


    /**
     * Registers all needed event listeners
     */
    __registerEventListener : function()
    {
      qx.event.Registration.addListener(window, "resize", this._updatePosition, this);

      if(this.__anchor) {
        this.__anchor.addCssClass("anchor-target");
        qx.ui.mobile.dialog.Popup.ROOT.addListener("touchstart",this._trackUserTouch,this);
      }

      this.addListener("touchstart", this._preventTouch, this);
    },


    /**
     * Unregisters all needed event listeners
     */
    __unregisterEventListener : function()
    {
      qx.event.Registration.removeListener(window, "resize", this._updatePosition, this);

      if(this.__anchor) {
        this.__anchor.removeCssClass("anchor-target");
        qx.ui.mobile.dialog.Popup.ROOT.removeListener("touchstart", this._trackUserTouch, this);
      }

      this.removeListener("touchstart", this._preventTouch, this);
    },


    /**
     * This method creates the container where the popup's widget will be placed
     * and adds it to the popup.
     * @param widget {qx.ui.mobile.core.Widget} - what to show in the popup
     *
     */
    _initializeChild : function(widget)
    {
      if(this.__childrenContainer == null) {
        this.__childrenContainer = new qx.ui.mobile.container.Composite(new qx.ui.mobile.layout.VBox().set({alignY: "middle"}));
        this.__childrenContainer.setDefaultCssClass("popup-content")
        this._add(this.__childrenContainer);
      }

      if(this._createTitleWidget()) {
        this.__childrenContainer.remove(this._createTitleWidget());
        this.__childrenContainer.add(this._createTitleWidget());
      }

      this.__childrenContainer.add(widget, {flex:1});

      this.__widget = widget;
    },


    /**
     * Creates the title atom widget.
     *
     * @return {qx.ui.mobile.basic.Atom} The title atom widget.
     */
    _createTitleWidget : function()
    {
      if(this.__titleWidget) {
        return this.__titleWidget;
      }
      if(this.getTitle() || this.getIcon())
      {
        this.__titleWidget = new qx.ui.mobile.basic.Atom(this.getTitle(), this.getIcon());
        this.__titleWidget.addCssClass('popup-title');
        return this.__titleWidget;
      }
      else
      {
        return null;
      }
    },


    // property apply
    _applyTitle : function(value, old)
    {
      if(value) {
        if(this.__titleWidget)
        {
          this.__titleWidget.setLabel(value);
        }
        else
        {
          this.__titleWidget = new qx.ui.mobile.basic.Atom(value, this.getIcon());
          this.__titleWidget.addCssClass('popup-title');

          if(this.__widget) {
            this.__childrenContainer.addBefore(this._createTitleWidget(), this.__widget);
          } else {
            if(this.__childrenContainer) {
              this.__childrenContainer.add(this._createTitleWidget());
            }
          }
        }
      }
    },


    // property apply
    _applyIcon : function(value, old)
    {
      if (value) {
        if (this.__titleWidget) {
          this.__titleWidget.setIcon(value);
        } else {
          this.__titleWidget = new qx.ui.mobile.basic.Atom(this.getTitle(), value);
          this.__titleWidget.addCssClass('popup-title');

          if (this.__widget) {
            this.__childrenContainer.addBefore(this._createTitleWidget(), this.__widget);
          } else {
            if (this.__childrenContainer) {
              this.__childrenContainer.add(this._createTitleWidget());
            }
          }
        }
      }
    },


    /**
     * Adds the widget that will be shown in this popup. This method can be used in the case when you have removed the widget from the popup
     * or you haven't passed it in the constructor.
     * @param widget {qx.ui.mobile.core.Widget} - what to show in the popup
     */
    add : function(widget)
    {
      this.removeWidget();
      this._initializeChild(widget);
    },


    /**
     * A widget to attach this popup to.
     *
     * @param widget {qx.ui.mobile.core.Widget} The anchor widget.
     */
    setAnchor : function(widget) {
      this.__anchor = widget;
      this._updatePosition();
    },


    /**
     * Returns the title widget.
     *
     * @return {qx.ui.mobile.basic.Atom} The title widget.
     */
    getTitleWidget : function() {
      return this.__titleWidget;
    },


    /**
     * This method removes the widget shown in the popup.
     * @return {qx.ui.mobile.core.Widget|null} The removed widget or <code>null</code>
     * if the popup doesn't have an attached widget
     */
    removeWidget : function()
    {
      if(this.__widget)
      {
        this.__childrenContainer.remove(this.__widget);
        return this.__widget;
      }
      else
      {
        if (qx.core.Environment.get("qx.debug")) {
          qx.log.Logger.debug(this, "this popup has no widget attached yet");
        }
        return null;
      }
    },


    /**
     * @deprecated {3.5} Please use qx.ui.mobile.core.Blocker.getInstance() instead.
     *
     * Returns the blocker widget.
     *
     * @return {qx.ui.mobile.core.Blocker} Returns the blocker widget.
     */
    _getBlocker : function()
    {
      return qx.ui.mobile.core.Blocker.getInstance();
    }
  },


  destruct : function()
  {
    this.__unregisterEventListener();
    this._disposeObjects("__childrenContainer");

    this.__isShown = this.__percentageTop = this._anchor = this.__widget = this.__lastPopupDimension = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Tino Butz (tbtz)

************************************************************************ */

/**
 * This class blocks events and can be included into all widgets.
 *
 */
qx.Class.define("qx.ui.mobile.core.Blocker",
{

  extend : qx.ui.mobile.core.Widget,
  type : "singleton",


  statics:
  {
    ROOT : null
  },


  construct : function()
  {
    this.base(arguments);

    if(qx.ui.mobile.core.Blocker.ROOT == null) {
      qx.ui.mobile.core.Blocker.ROOT = qx.core.Init.getApplication().getRoot();
    }
    this.forceHide();
    qx.ui.mobile.core.Blocker.ROOT.add(this);
  },


  properties :
  {
    // overridden
    defaultCssClass :
    {
      refine : true,
      init : "blocker"
    }
  },


  members :
  {
    __count : 0,


    /**
     * Shows the blocker. When the show method is called a counter is incremented.
     * The {@link #hide} method needs to be called as many times as the {@link #show}
     * method. This behavior is useful, when you want to show a loading indicator.
     */
    show : function()
    {
      if (this.__count == 0)
      {
        this._updateSize();
        this.__registerEventListener();
        this.base(arguments);
      }
      this.__count++;
    },


    /**
     * Hides the blocker. The blocker is only hidden when the hide method
     * is called as many times as the {@link #show} method.
     */
    hide : function()
    {
      this.__count--;
      if (this.__count <= 0)
      {
        this.__count = 0;
        this.__unregisterEventListener();
        this.exclude();
      }
    },


    /**
     * Force the blocker to hide, even when the show counter is larger than
     * zero.
     */
    forceHide : function()
    {
      this.__count = 0;
      this.hide();
    },


    /**
     * Whether the blocker is shown or not.
     * @return {Boolean} <code>true</code> if the blocker is shown
     */
    isShown : function()
    {
      return this.__count > 0;
    },


    /**
     * Event handler. Called whenever the size of the blocker should be updated.
     */
    _updateSize : function()
    {
      if(qx.ui.mobile.core.Blocker.ROOT == this.getLayoutParent())
      {
        this.getContainerElement().style.top = qx.bom.Viewport.getScrollTop() + "px";
        this.getContainerElement().style.left = qx.bom.Viewport.getScrollLeft() + "px";
        this.getContainerElement().style.width = qx.bom.Viewport.getWidth() + "px";
        this.getContainerElement().style.height = qx.bom.Viewport.getHeight()  + "px";
      }
      else if(this.getLayoutParent() != null)
      {
        var dimension = qx.bom.element.Dimension.getSize(this.getLayoutParent().getContainerElement());
        this.getContainerElement().style.width = dimension.width + "px";
        this.getContainerElement().style.height = dimension.height  + "px";
      }
    },


    /**
     * Event handler. Called when the touch event occurs.
     * Prevents the default of the event.
     *
     * @param evt {qx.event.type.Touch} The touch event
     */
    _onTouch : function(evt)
    {
      evt.preventDefault();
    },


    /**
     * Event handler. Called when the scroll event occurs.
     *
     * @param evt {qx.event.type.Touch} The touch event
     */
    _onScroll : function(evt)
    {
      this._updateSize();
    },


    /**
     * Registers all needed event listener.
     */
    __registerEventListener : function()
    {
      qx.event.Registration.addListener(window, "resize", this._updateSize, this);
      qx.event.Registration.addListener(window, "scroll", this._onScroll, this);
      this.addListener("touchstart", this._onTouch, this);
      this.addListener("touchmove", this._onTouch, this);
    },


    /**
     * Unregisters all needed event listener.
     */
    __unregisterEventListener : function()
    {
      qx.event.Registration.removeListener(window, "resize", this._updateSize, this);
      qx.event.Registration.removeListener(window, "scroll", this._onScroll, this);
      this.removeListener("touchstart", this._onTouch, this);
      this.removeListener("touchmove", this._onTouch, this);
    }
  },


  destruct : function()
  {
    qx.ui.mobile.core.Blocker.ROOT.remove(this);
    this.__unregisterEventListener();
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Tino Butz (tbtz)

************************************************************************ */

/**
 * The TextArea is a multi-line text input field.
 */
qx.Class.define("qx.ui.mobile.form.TextArea",
{
  extend : qx.ui.mobile.core.Widget,
  include : [
    qx.ui.mobile.form.MValue,
    qx.ui.mobile.form.MText,
    qx.ui.form.MForm,
    qx.ui.form.MModelProperty,
    qx.ui.mobile.form.MState
  ],
  implement : [
    qx.ui.form.IForm,
    qx.ui.form.IModel
  ],


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param value {var?null} The value of the widget.
   */
  construct : function(value)
  {
    this.base(arguments);
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    // overridden
    defaultCssClass :
    {
      refine : true,
      init : "text-area"
    }

  },


  members :
  {
    // overridden
    _getTagName : function()
    {
      return "textarea";
    }

  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2011-2013 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christopher Zuendorf (czuendorf)

************************************************************************ */

/**
 * This widget displays a menu. A dialog menu extends a popup and contains a
 * list, which provides the user the possibility to select one value.
 * The selected value is identified through selected index.
 *
 *
 * *Example*
 * <pre class='javascript'>
 *
 * var model = new qx.data.Array(["item1","item2","item3"]);
 *
 * var menu = new qx.ui.mobile.dialog.Menu(model);
 * menu.show();
 * menu.addListener("changeSelection", function(evt){
 *    var selectedIndex = evt.getData().index;
 *    var selectedItem = evt.getData().item;
 * }, this);
 * </pre>
 *
 * This example creates a menu with several choosable items.
 */
qx.Class.define("qx.ui.mobile.dialog.Menu",
{
  extend : qx.ui.mobile.dialog.Popup,


  /**
   * @param itemsModel {qx.data.Array ?}, the model which contains the choosable items of the menu.
   * @param anchor {qx.ui.mobile.core.Widget ?} The anchor widget for this item. If no anchor is available, the menu will be displayed modal and centered on screen.
   */
  construct : function(itemsModel, anchor)
  {
    // Create the list with a delegate that
    // configures the list item.
    this.__selectionList = this._createSelectionList();

    if(itemsModel) {
      this.__selectionList.setModel(itemsModel);
    }

    this.__menuContainer = new qx.ui.mobile.container.Composite();
    this.__clearButton = this._createClearButton();
    this.__listScroller = this._createListScroller(this.__selectionList);

    this.__menuContainer.add(this.__listScroller);
    this.__menuContainer.add(this.__clearButton);

    this.base(arguments, this.__menuContainer, anchor);

    if(anchor) {
      this.setModal(false);
    } else {
      this.setModal(true);
    }
  },


  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /**
     * Fired when the selection is changed.
     */
    changeSelection : "qx.event.type.Data"
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    // overridden
    defaultCssClass :
    {
      refine : true,
      init : "menu"
    },


    /**
     *  Class which is assigned to selected items.
     *  Useful for re-styling your menu via LESS.
     */
    selectedItemClass :
    {
      init : "item-selected"
    },


    /**
     * Class which is assigned to unselected items.
     * Useful for re-styling your menu via LESS.
     */
    unselectedItemClass :
    {
      init : "item-unselected"
    },


    /**
     * Defines if the menu has a null value in the list, which can be chosen
     * by the user. The label
     */
    nullable :
    {
      init : false,
      check : "Boolean",
      apply : "_applyNullable"
    },


    /**
     * The label of the null value entry of the list. Only relevant
     * when nullable property is set to <code>true</code>.
     */
    clearButtonLabel :
    {
      init : "None",
      check : "String",
      apply : "_applyClearButtonLabel"
    },


    /**
     * The selected index of this menu.
     */
    selectedIndex :
    {
      check : "Integer",
      apply : "_applySelectedIndex",
      nullable : true
    },


    /**
    * This value defines how much list items are visible inside the menu.
    */
    visibleListItems :
    {
      check : "Integer",
      apply : "_updatePosition",
      nullable : true
    }
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __selectionList: null,
    __clearButton : null,
    __listScroller : null,
    __menuContainer : null,


    // overidden
    show : function() {
      this.base(arguments);

      this.scrollToItem(this.getSelectedIndex());
    },


    /**
     * Creates the clearButton. Override this to customize the widget.
     *
     * @return {qx.ui.mobile.form.Button} the clearButton of this menu.
     */
    _createClearButton : function() {
      var clearButton = new qx.ui.mobile.form.Button(this.getClearButtonLabel());
      clearButton.addListener("tap", this.__onClearButtonTap, this);
      clearButton.exclude();
      return clearButton;
    },


    /**
     * Creates the scrollComposite for the selectionList. Override this to customize the widget.
     * @param selectionList {qx.ui.mobile.list.List} The selectionList of this menu.
     * @return {qx.ui.mobile.container.ScrollComposite} the scrollComposite which contains the selectionList of this menu.
     */
    _createListScroller : function(selectionList) {
      var listScroller = new qx.ui.mobile.container.ScrollComposite();
      listScroller.add(selectionList, {
        flex: 1
      });
      listScroller.addCssClass("menu-scroller");
      listScroller.setHeight(null);
      listScroller.setPreventEvents(false);
      return listScroller;
    },


    /**
    * Getter for the scrollComposite which contains a @see {qx.ui.mobile.list.List} with the choosable items.
    * @return {qx.ui.mobile.container.ScrollComposite} the scrollComposite which contains the selectionList of this menu.
    */
    _getListScroller : function() {
      return this.__listScroller;
    },


    // overridden
    _updatePosition : function() {
      var parentHeight = qx.bom.element.Style.get(qx.ui.mobile.dialog.Popup.ROOT.getContentElement(),"height");
      var listScrollerHeight = parseInt(parentHeight, 10) * 0.75;

      if (this.getVisibleListItems() !== null) {
        var newListScrollerHeight = this.__selectionList.getListItemHeight() * this.getVisibleListItems();
        if(newListScrollerHeight < listScrollerHeight) {
          listScrollerHeight = newListScrollerHeight;
        }
      }
      this.__listScroller.setHeight(listScrollerHeight + "px");

      this.base(arguments);
    },


    /**
     * Creates the selection list. Override this to customize the widget.
     *
     * @return {qx.ui.mobile.list.List} The selectionList of this menu.
     */
    _createSelectionList : function() {
      var self = this;
      var selectionList = new qx.ui.mobile.list.List({
        configureItem : function(item, data, row)
        {
          item.setTitle(data);
          item.setShowArrow(false);

          var isItemSelected = (self.getSelectedIndex() == row);

          if(isItemSelected) {
            item.removeCssClass(self.getUnselectedItemClass());
            item.addCssClass(self.getSelectedItemClass());
          } else {
            item.removeCssClass(self.getSelectedItemClass());
            item.addCssClass(self.getUnselectedItemClass());
          }
        }
      });

      // Add an changeSelection event
      selectionList.addListener("changeSelection", this.__onListChangeSelection, this);
      selectionList.addListener("tap", this._onSelectionListTap, this);
      return selectionList;
    },


    /**
    * Getter for the selectionList of the menu.
    * @return {qx.ui.mobile.list.List} The selectionList of this menu.
    */
    getSelectionList : function() {
      return this.__selectionList;
    },


    /** Handler for tap event on selection list. */
    _onSelectionListTap : function() {
      this.hideWithDelay(500);
    },


    /**
     * Sets the choosable items of the menu.
     * @param itemsModel {qx.data.Array}, the model of choosable items in the menu.
     */
    setItems : function (itemsModel) {
      if(this.__selectionList) {
        this.__selectionList.setModel(null);
        this.__selectionList.setModel(itemsModel);
      }
    },


    /**
     * Fires an event which contains index and data.
     * @param evt {qx.event.type.Data}, contains the selected index number.
     */
    __onListChangeSelection : function (evt) {
      this.setSelectedIndex(evt.getData());
    },


    /**
     * Event handler for tap on clear button.
     */
    __onClearButtonTap : function() {
      this.fireDataEvent("changeSelection", {index: null, item: null});
      this.hide();
    },


    // property apply
    _applySelectedIndex : function(value, old) {
      var listModel = this.__selectionList.getModel();

      if(listModel !== null) {
        var selectedItem = listModel.getItem(value);
        this.fireDataEvent("changeSelection", {index: value, item: selectedItem});
      }

      this._render();
    },


    // property apply
    _applyNullable : function(value, old) {
      if(value){
        this.__clearButton.setVisibility("visible");
      } else {
        this.__clearButton.setVisibility("excluded");
      }
    },


    // property apply
    _applyClearButtonLabel : function(value, old) {
      this.__clearButton.setValue(value);
    },


    /**
     * Triggers (re-)rendering of menu items.
     */
    _render : function() {
      var tmpModel = this.__selectionList.getModel();
      this.__selectionList.setModel(null);
      this.__selectionList.setModel(tmpModel);
    },


    /**
     * Scrolls the scroll wrapper of the selectionList to the item with given index.
     * @param index {Integer}, the index of the listItem to which the listScroller should scroll to.
     */
    scrollToItem : function(index) {
      var scrollY = 0;
      if (index !== null && this.__selectionList.getModel() != null) {
        var listScrollChild = this.__listScroller.getScrollContainer();
        var listItemLength = this.__selectionList.getModel().length;
        var listScrollHeight = listScrollChild.getContainerElement().scrollHeight;
        var listItemHeight = listScrollHeight / listItemLength;

        var lastItemIndex = listItemLength - this.getVisibleListItems();
        if(index > lastItemIndex) {
          index = lastItemIndex;
        }

        if (listItemHeight) {
          scrollY = index * listItemHeight;
        }
      }

      this.__listScroller.scrollTo(0, -scrollY);
    }
  },

  /*
  *****************************************************************************
      DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    this.__selectionList.removeListener("tap", this._onSelectionListTap, this);
    qx.ui.mobile.core.Blocker.getInstance().removeListener("tap", this.hide, this);
    this._disposeObjects("__selectionList","__clearButton","__listScroller","__menuContainer");
  }

});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2013 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christopher Zuendorf (czuendorf)

************************************************************************ */

/**
 * The ScrollComposite is a extension of {@linkqx.ui.mobile.container.Composite},
 * and makes it possible to scroll vertically, if content size is greater than
 * scrollComposite's size.
 *
 * Every widget will be added to child's composite.
 *
 * *Example*
 *
 * Here is a little example of how to use the widget.
 *
 * <pre class='javascript'>
 *   // create the composite
 *   var scrollComposite = new qx.ui.mobile.container.ScrollComposite();
 *
 *   scrollComposite.setLayout(new qx.ui.mobile.layout.HBox());
 *
 *   // add some children
 *   scrollComposite.add(new qx.ui.mobile.basic.Label("Name: "), {flex:1});
 *   scrollComposite.add(new qx.ui.mobile.form.TextField());
 * </pre>
 *
 * This example horizontally groups a label and text field by using a
 * Composite configured with a horizontal box layout as a container.
 */
qx.Class.define("qx.ui.mobile.container.ScrollComposite",
{
  extend : qx.ui.mobile.container.Composite,

  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param layout {qx.ui.mobile.layout.Abstract?null} The layout that should be used for this
   *     container
   */
  construct : function(layout)
  {
    this.base(arguments);

    this.__lastOffset = [0,0];
    this.__currentOffset = [0,0];
    this.__touchStartPoints = [0,0];

    this._scrollContainer = this._createScrollContainer();

    this.addListener("touchstart", this._onTouchStart, this);
    this.addListener("touchmove", this._onTouchMove, this);
    this.addListener("touchend", this._onTouchEnd, this);
    this.addListener("swipe", this._onSwipe, this);

    this._setLayout(new qx.ui.mobile.layout.HBox());
    this._add(this._scrollContainer, {flex:1});

    this._updateScrollIndicator(this.__lastOffset[1]);

    this.initHeight();
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */
  properties :
  {
    // overridden
    defaultCssClass :
    {
      refine : true,
      init : "scroll-container"
    },

    /** Flag if scrolling in horizontal direction should be allowed. */
    scrollableX :
    {
      init : false,
      check : "Boolean"
    },

    /** Flag if scrolling in vertical direction should be allowed. */
    scrollableY :
    {
      init : true,
      check : "Boolean"
    },

    /** Controls whether are visual indicator is used, when the scrollComposite is
     * scrollable to top or bottom direction. */
    showScrollIndicator :
    {
      init : true,
      check : "Boolean",
      apply : "_updateScrollIndicator"
    },


    /**
    * This flag controls whether this widget has a fixed height
    * or grows till the property value of <code>height</code> has reached.
    */
    fixedHeight :
    {
      init : false,
      check : "Boolean",
      apply : "_applyFixedHeight"
    },


    /**
     * The height of this widget.
     * Allowed values are length or percentage values according to <a src="https://developer.mozilla.org/en-US/docs/CSS/height" target="_blank">CSS height syntax</a>.
     */
    height :
    {
      init : "10rem",
      check : "String",
      nullable : true,
      apply : "_applyHeight"
    }
  },


  members :
  {
    _scrollContainer : null,
    __touchStartPoints : null,
    __lastOffset : null,
    __currentOffset : null,
    __isVerticalScroll : null,
    __distanceX : null,
    __distanceY : null,
    __preventEvents : true,


    /**
     * Getter for the inner scrollContainer of this scrollComposite.
     * @return {qx.ui.mobile.container.Composite} a composite which represents the scrollContainer.
     */
    getScrollContainer : function() {
      return this._scrollContainer;
    },


    /**
     * Factory method for the scrollContainer.
     * @return {qx.ui.mobile.container.Composite} a composite which represents the scrollContainer.
     */
    _createScrollContainer : function() {
      var scrollContainer = new qx.ui.mobile.container.Composite();
      scrollContainer.setTransformUnit("px");
      scrollContainer.addCssClass("scroll-container-child");
      return scrollContainer;
    },


    /**
    * Handler for <code>touchstart</code> events on scrollContainer
    * @param evt {qx.event.type.Touch} The touch event
    */
    _onTouchStart : function(evt){
      this.__isVerticalScroll = (this.getScrollableX() && this.getScrollableY()) ? null : this.getScrollableY();

      this._applyNoEasing();
      this.__touchStartPoints[0] = evt.getViewportLeft();
      this.__touchStartPoints[1] = evt.getViewportTop();

      this.__distanceX = 0;
      this.__distanceY = 0;

      if (this.__preventEvents === true) {
        evt.stopPropagation();
      }
    },


    /**
     * Handler for <code>touchmove</code> events on scrollContainer
     * @param evt {qx.event.type.Touch} The touch event
     */
    _onTouchMove : function(evt) {
      if (this.isScrollableX()) {
        this.__distanceX = evt.getViewportLeft() - this.__touchStartPoints[0];

        this.__calcVerticalScroll();

        if (Math.abs(this.__distanceY) < 3 || !this.isScrollableY() || !this.__isVerticalScroll) {
          this.__distanceY = 0;
        }

        this.__currentOffset[0] = Math.floor(this.__lastOffset[0] + this.__distanceX);
        this._scrollContainer.setTranslateX(this.__currentOffset[0]);
      }

      if (this.isScrollableY()) {
        this.__distanceY = evt.getViewportTop() - this.__touchStartPoints[1];

        this.__calcVerticalScroll();

        if (Math.abs(this.__distanceX) < 3 || !this.isScrollableX() || this.__isVerticalScroll) {
          this.__distanceX = 0;
        }

        this.__currentOffset[1] = Math.floor(this.__lastOffset[1] + this.__distanceY);
        this._scrollContainer.setTranslateY(this.__currentOffset[1]);

        this._updateScrollIndicator(this.__currentOffset[1]);
      }

      if (this.__preventEvents === true) {
        evt.stopPropagation();
        evt.preventDefault();
      }
    },


    /** Calculates whether the touch gesture is vertical or horizontal. */
    __calcVerticalScroll : function() {
      if (this.__isVerticalScroll === null) {
        this.__isVerticalScroll = Math.abs(this.__distanceX / this.__distanceY) < 2;
      }
    },


    /**
     * Handler for <code>touchend</code> events on scrollContainer
     * @param evt {qx.event.type.Touch} The touch event.
     */
    _onTouchEnd : function(evt) {
      if (this.__preventEvents === true) {
        evt.stopPropagation();
      }
    },


    /**
     * Updates the visibility of the vertical scroll indicator (top or bottom).
     * @param positionY {Integer} current offset of the scrollContainer.
     */
    _updateScrollIndicator : function(positionY) {
      var targetElement =  this._scrollContainer.getContainerElement();
      var needsScrolling = targetElement.scrollHeight > targetElement.offsetHeight;

      if(this.isScrollableY() && this.isShowScrollIndicator() && needsScrolling) {
        var lowerLimit = targetElement.scrollHeight - targetElement.offsetHeight - 4;

        // Upper Limit Y
        if(positionY >= 0) {
          this.removeCssClass("scrollable-top");
        } else {
          this.addCssClass("scrollable-top");
        }

        // Lower Limit Y
        if(positionY < -lowerLimit) {
          this.removeCssClass("scrollable-bottom");
        } else {
          this.addCssClass("scrollable-bottom");
        }
      } else {
        this.removeCssClass("scrollable-top");
        this.removeCssClass("scrollable-bottom");
      }
    },


    /**
     * Swipe handler for scrollContainer.
     * @param evt {qx.event.type.Swipe} The swipe event.
     */
    _onSwipe : function(evt) {
      var velocity = Math.abs(evt.getVelocity());

      var swipeDuration = new Date().getTime() - evt.getStartTime();

      if(this.isScrollableY() && this.__isVerticalScroll && swipeDuration < 500) {
        this._applyMomentumEasing();

        this.__currentOffset[1] = this.__currentOffset[1] + (velocity * 1.5 * this.__distanceY);
      }

      this.scrollTo(this.__currentOffset[0], this.__currentOffset[1]);
    },


    /**
     * Scrolls the scrollContainer to the given position,
     * depending on the state of properties scrollableX and scrollableY.
     * @param positionX {Integer} target offset x
     * @param positionY {Integer} target offset y
     */
    scrollTo : function(positionX, positionY) {
      positionX = Math.floor(positionX);
      positionY = Math.floor(positionY);

      var targetElement = this._scrollContainer.getContainerElement();

      var lowerLimitY = targetElement.scrollHeight - this.getContentElement().clientHeight;
      var lowerLimitX = targetElement.scrollWidth - targetElement.offsetWidth - 4;

      var oldY = this._scrollContainer.getTranslateY();

      // Upper Limit Y
      if (positionY >= 0) {
        if (oldY < 0) {
          this._applyScrollBounceEasing();
        } else {
          this._applyBounceEasing();
        }

        positionY = 0;
      }

      // Lower Limit Y
      if (positionY < -lowerLimitY) {
        if (oldY > -lowerLimitY) {
          this._applyScrollBounceEasing();
        } else {
          this._applyBounceEasing();
        }

        positionY = -lowerLimitY;
      }
      if (!this.__isVerticalScroll) {
        // Left Limit X
        if (positionX >= 0) {
          this._applyBounceEasing();

          positionX = 0;
        }
        // Right Limit X
        if (positionX < -lowerLimitX) {
          this._applyBounceEasing();

          positionX = -lowerLimitX;
        }
      }

      if (this.isScrollableX()) {
        this._scrollContainer.setTranslateX(positionX);
        this.__lastOffset[0] = positionX;
      }
      if (this.isScrollableY()) {
        this._scrollContainer.setTranslateY(positionY);
        this.__lastOffset[1] = positionY;
      }
      this._updateScrollIndicator(this.__lastOffset[1]);
    },


    //overridden
    add : function(child, options) {
      this._scrollContainer.add(child,options);
      this._handleSize(child);
    },


    // overridden
    addAfter : function(child, after, layoutProperties) {
      this._scrollContainer.addAfter(child, after, layoutProperties);
      this._handleSize(child);
    },


    // overridden
    addAt : function(child, index, options) {
      this._scrollContainer.addAt(child, index, options);
      this._handleSize(child);
    },


    // overridden
    addBefore : function(child, before, layoutProperties) {
      this._scrollContainer.addBefore(child, before, layoutProperties);
      this._handleSize(child);
    },


    // overridden
    getChildren : function() {
      return this._scrollContainer.getChildren();
    },


    // overridden
    getLayout : function() {
      return this._scrollContainer.getLayout();
    },


     // overridden
    setLayout : function(layout) {
      this._scrollContainer.setLayout(layout);
    },


    // overridden
    hasChildren : function() {
      return this._scrollContainer.getLayout();
    },


    indexOf : function(child) {
      this._scrollContainer.indexOf(child);
    },


    // overridden
    remove : function(child) {
      this._unhandleSize(child);
      this._scrollContainer.remove(child);
    },


    // overridden
    removeAll : function() {
      var children = this.getChildren();
      for(var i = 0; i < children.length; i++) {
        this._unhandleSize(children[i]);
      }

      this._scrollContainer.removeAll();
    },


    // overridden
    removeAt : function(index) {
      var children = this.getChildren();
      this._unhandleSize(children[index]);
      this._scrollContainer.removeAt(index);
    },


    // Property apply
    _applyFixedHeight : function(value, old) {
      this._applyHeight(this.getHeight());
    },


    // Property apply
    _applyHeight : function(value, old) {
      var cssProperty = "maxHeight";
      if (this.getFixedHeight() === true) {
        cssProperty = "height";
      }
      qx.bom.element.Style.set(this.getContainerElement(), cssProperty, this.getHeight());
    },


    /**
     * Deactivates any scroll easing for the scrollContainer.
     */
    _applyNoEasing : function() {
      this._scrollContainer.removeCssClass("momentum-ease");
      this._scrollContainer.removeCssClass("bounce-ease");
      this._scrollContainer.removeCssClass("scroll-bounce-ease");
    },


    /**
     * Activates momentum scrolling for the scrollContainer.
     * Appears like a "ease-out" easing function.
     */
    _applyMomentumEasing : function() {
      this._applyNoEasing();
      this._scrollContainer.addCssClass("momentum-ease");
    },


    /**
     * Activates bounce easing for the scrollContainer.
     * Used when user drags the scrollContainer over the edge manually.
     */
    _applyBounceEasing : function() {
      this._applyNoEasing();
      this._scrollContainer.addCssClass("bounce-ease");
    },


    /**
     * Activates the scroll bounce easing for the scrollContainer.
     * Used when momentum scrolling is activated and the momentum calculates an
     * endpoint outside of the viewport.
     * Causes the effect that scrollContainers scrolls to far and bounces back to right position.
     */
    _applyScrollBounceEasing : function() {
      this._applyNoEasing();
      this._scrollContainer.addCssClass("scroll-bounce-ease");
    },


    /**
     * Checks if size handling is needed:
     * if true, it adds all listener which are needed for synchronizing the scrollHeight to
     * elements height.
     * @param child {qx.ui.mobile.core.Widget} target child widget.
     */
    _handleSize : function(child) {
      // If item is a text area, then it needs a special treatment.
      // Install listener to the textArea for syncing the scrollHeight to
      // textAreas height.
      if(child instanceof qx.ui.mobile.form.TextArea) {
        child.addListener("appear", this._fixChildElementsHeight, child);
        child.addListener("input", this._fixChildElementsHeight, child);
        child.addListener("changeValue", this._fixChildElementsHeight, child);
      }
    },


    /**
     * Removes Listeners from a child if necessary.
     * @param child {qx.ui.mobile.core.Widget} target child widget.
     */
    _unhandleSize : function(child) {
      // If item is a text area, then it needs a special treatment.
      // Install listener to the textArea for syncing the scrollHeight to
      // textAreas height.
      if(child instanceof qx.ui.mobile.form.TextArea) {
        child.removeListener("appear", this._fixChildElementsHeight, child);
        child.removeListener("input", this._fixChildElementsHeight, child);
        child.removeListener("changeValue", this._fixChildElementsHeight, child);
      }
    },


    /**
     * Synchronizes the elements.scrollHeight and its height.
     * Needed for making textArea scrollable.
     * @param evt {qx.event.type.Data} a custom event.
     */
    _fixChildElementsHeight : function(evt) {
      this.getContainerElement().style.height = 'auto';
      this.getContainerElement().style.height = this.getContainerElement().scrollHeight+'px';
    },


    /**
     * Setter for the <code>preventEvents</code> flag, which controls whether
     * touch events should be passed to contained widgets.
     * @param value {Boolean} flag if the events will be prevented.
     * @internal
     */
    setPreventEvents : function(value) {
      this.__preventEvents = value;
    }
  },


  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */
  destruct : function()
  {
    this.removeListener("touchstart",this._onTouchStart,this);
    this.removeListener("touchmove",this._onTouchMove,this);
    this.removeListener("touchend",this._onTouchEnd,this);
    this.removeListener("swipe",this._onSwipe,this);

    var children = this.getChildren();
    for(var i = 0; i < children.length; i++) {
      this._unhandleSize(children[i]);
    }

    this._disposeObjects("_scrollContainer");

    this.__isVerticalScroll = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2012 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Gabriel Munteanu (gabios)
     * Christopher Zuendorf (czuendorf)

************************************************************************ */

/**
 * Single renderer is a class used to render forms into a mobile page.
 * It displays a label above or next to each form element.
 *
 */
qx.Class.define("qx.ui.mobile.form.renderer.Single",
{

  extend : qx.ui.mobile.form.renderer.AbstractRenderer,


  construct : function(form)
  {
    this.__errorMessageContainers = [];
    this._rows = [];
    this._labels = [];
    this.base(arguments,form);
    this.addCssClass("single");
  },


  statics : {

    /** @type {Array} qx.Mobile form widgets which are rendered in one single line. */
    ONE_LINE_WIDGETS : [
      qx.ui.mobile.form.ToggleButton,
      qx.ui.mobile.form.RadioButton,
      qx.ui.mobile.form.TextField,
      qx.ui.mobile.form.PasswordField,
      qx.ui.mobile.form.NumberField,
      qx.ui.mobile.form.CheckBox,
      qx.ui.mobile.form.SelectBox
    ]
  },


  members :
  {

    _rows : null,
    _labels : null,

    /**
     * A collection of error containers used to keep the error messages
     * resulted after form validation.
     * Also useful to clear them when the validation passes.
     */
    __errorMessageContainers : null,


    // override
    _getTagName : function()
    {
      return "ul";
    },


     /**
     * Determines whether the given item can be display in one line
     * or whether a separate line for the text label is needed.
     * @param item {qx.ui.mobile.core.Widget} the widget which should be added.
     * @return {Boolean} it indicates whether the widget can be displayed
     *  in same line as the label.
     */
    _isOneLineWidget : function(item) {
      var widgets = qx.ui.mobile.form.renderer.Single.ONE_LINE_WIDGETS;

      for (var i = 0; i < widgets.length; i++) {
        var widget = widgets[i];
        if(item instanceof widget) {
          return true;
        }
      }

      return false;
    },


    // override
    addItems : function(items, names, title) {
      if(title !== null)
      {
        this._addGroupHeader(title);
      }

      this._addGroupHeaderRow();
      for(var i=0, l=items.length; i<l; i++)
      {
        var item = items[i];
        var name = names[i];
        var isLastItem = (i==items.length-1);

        if(item instanceof qx.ui.mobile.form.TextArea) {
          this._addInScrollComposite(item,name);
        } else {
          if (this._isOneLineWidget(item)) {
            this._addRow(item, name, new qx.ui.mobile.layout.HBox());
          } else {
            this._addRow(item, name, new qx.ui.mobile.layout.VBox());
          }
        }

        if(!isLastItem) {
          this._addSeparationRow();
        }
      }

      this._addGroupFooterRow();
    },


    /**
     * Wraps the given item with a {@link qx.ui.mobile.container.ScrollComposite} and
     * calls _addInSeparateLines() with the composite as item.
     * @param item {qx.ui.mobile.core.Widget} A form item to render.
     * @param name {String} A name for the form item.
     */
    _addInScrollComposite : function(item,name) {
      var scrollContainer = new qx.ui.mobile.container.ScrollComposite();
      scrollContainer.setFixedHeight(true);
      scrollContainer.setShowScrollIndicator(false);
      scrollContainer.add(item, {
        flex: 1
      });

      this._addRow(scrollContainer,name,new qx.ui.mobile.layout.VBox());
    },


    /**
     * @deprecated {3.5} Please use this._addRow(item, name, new qx.ui.mobile.layout.VBox()) instead.
     *
     * Adds a label and the widgets in two separate lines (rows).
     * @param item {qx.ui.mobile.core.Widget} A form item to render.
     * @param name {String} A name for the form item.
     */
    _addInSeparateLines : function(item, name) {
      this._addRow(item, name, new qx.ui.mobile.layout.VBox());
    },


    /**
     * @deprecated {3.5} Please use this._addRow(item, name, new qx.ui.mobile.layout.HBox()) instead.
     *
     * Adds a label and it according widget in one line (row).
     * @param item {qx.ui.mobile.core.Widget} A form item to render.
     * @param name {String} A name for the form item.
     */
    _addInOneLine : function(item, name) {
      this._addRow(item, name, new qx.ui.mobile.layout.HBox());
    },


    /**
    * Adds a label and its according widget in a row and applies the given layout.
    * @param item {qx.ui.mobile.core.Widget} A form item to render.
    * @param name {String} A name for the form item.
    * @param layout {qx.ui.mobile.layout.Abstract} layout of the rendered row.
    */
    _addRow : function(item, name, layout) {
      var row = new qx.ui.mobile.form.Row(layout);
      row.addCssClass("form-row-content");

      if(name !== null) {
        var label = new qx.ui.mobile.form.Label(name);
        label.setLabelFor(item.getId());
        row.add(label, {flex:1});
        this._labels.push(label);
      }
      row.add(item);
      this._add(row);
      this._rows.push(row);
    },


    /**
     * Adds a separation line into the form.
     */
    _addSeparationRow : function() {
      var row = new qx.ui.mobile.form.Row();
      row.addCssClass("form-separation-row");
      this._add(row);
      this._rows.push(row);
    },


    /**
     * Adds an row group header.
     */
    _addGroupHeaderRow : function() {
      var row = new qx.ui.mobile.form.Row();
      row.addCssClass("form-row-group-first");
      this._add(row);
      this._rows.push(row);
    },


    /**
     * Adds an row group footer.
     */
    _addGroupFooterRow : function() {
      var row = new qx.ui.mobile.form.Row();
      row.addCssClass("form-row-group-last");
      this._add(row);
      this._rows.push(row);
    },


    /**
     * Adds a row with the name of a group of elements
     * When you want to group certain form elements, this methods implements
     * the way the header of that group is presented.
     * @param title {String} the title shown in the group header
     */
    _addGroupHeader : function(title)
    {
      var row = new qx.ui.mobile.form.Row();
      row.addCssClass("form-row-group-title");
      var titleLabel = new qx.ui.mobile.basic.Label(title);
      row.add(titleLabel);
      this._add(row);
      this._labels.push(titleLabel);
      this._rows.push(row);
    },


    // override
    addButton : function(button) {
      var row = new qx.ui.mobile.form.Row(new qx.ui.mobile.layout.HBox());
      row.add(button, {flex:1});
      this._add(row);
      this._rows.push(row);
    },


    // override
    showErrorForItem : function(item) {
      var errorNode = qx.dom.Element.create('div');
      errorNode.innerHTML = item.getInvalidMessage();
      qx.bom.element.Class.add(errorNode, 'form-element-error');
      qx.dom.Element.insertAfter(errorNode, item.getLayoutParent().getContainerElement());
      this.__errorMessageContainers.push(errorNode);
    },


    /**
     * Shows a single item of this form
     * @param item {qx.ui.form.IForm} form item which should be hidden.
     */
    showItem : function(item) {
      item.getLayoutParent().removeCssClass("exclude");
    },


    /**
     * Hides a single item of this form
     * @param item {qx.ui.form.IForm} form item which should be hidden.
     */
    hideItem : function(item) {
      item.getLayoutParent().addCssClass("exclude");
    },


    // override
    resetForm : function() {
      for(var i=0; i < this.__errorMessageContainers.length; i++) {
        qx.dom.Element.remove(this.__errorMessageContainers[i]);
      }
    }
  },


 /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    this.resetForm();
    this._disposeArray("_labels");
    this._disposeArray("_rows");
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Tino Butz (tbtz)

************************************************************************ */

/**
 * The Row widget represents a row in a {@link Form}.
 */
qx.Class.define("qx.ui.mobile.form.Row",
{
  extend : qx.ui.mobile.container.Composite,


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param layout {qx.ui.mobile.layout.Abstract?null} The layout that should be used for this
   *     container
   */
  construct : function(layout)
  {
    this.base(arguments, layout);
    this.initSelectable();
  },




  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    // overridden
    defaultCssClass :
    {
      refine : true,
      init : "form-row"
    },


    /**
     * Whether the widget is selectable or not.
     */
    selectable :
    {
      check : "Boolean",
      init : false,
      apply : "_applyAttribute"
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    // overridden
    _getTagName : function()
    {
      return "li";
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2012 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christopher Zuendorf (czuendorf)

************************************************************************ */

/**
 * The label widget displays a text or HTML content in form context.
 *
 * It uses the html tag <label>, for making it possible to set the
 * "for" attribute.
 *
 * The "for" attribute specifies which form element a label is bound to.
 * A tap on the label is forwarded to the bound element.
 *
 * *Example*
 *
 * Here is a little example of how to use the widget.
 *
 * <pre class='javascript'>
 *   var checkBox = new qx.ui.mobile.form.CheckBox();
 *   var label = new qx.ui.mobile.form.Label("Label for CheckBox");
 *
 *   label.setLabelFor(checkBox.getId());
 *
 *   this.getRoot().add(label);
 *   this.getRoot().add(checkBox);
 * </pre>
 *
 * This example create a widget to display the label.
 *
 */
qx.Class.define("qx.ui.mobile.form.Label",
{
  extend : qx.ui.mobile.core.Widget,


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param value {String?null} Text or HTML content to display
   */
  construct : function(value)
  {
    this.base(arguments);
    if (value) {
      this.setValue(value);
    }

    this.addCssClass("boxAlignCenter");
    this._setLayout(new qx.ui.mobile.layout.HBox());

    this.initWrap();

    if (qx.core.Environment.get("qx.dynlocale")) {
      qx.locale.Manager.getInstance().addListener("changeLocale", this._onChangeLocale, this);
    }
  },



  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    // overridden
    defaultCssClass :
    {
      refine : true,
      init : "label"
    },


    /**
     * Text or HTML content to display
     */
    value :
    {
      nullable : true,
      init : null,
      apply : "_applyValue",
      event : "changeValue"
    },


    // overridden
    anonymous :
    {
      refine : true,
      init : false
    },


    /**
     * Controls whether text wrap is activated or not.
     */
    wrap :
    {
      check : "Boolean",
      init : true,
      apply : "_applyWrap"
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __forWidget : null,


     // overridden
    _getTagName : function()
    {
      return "label";
    },


    // property apply
    _applyValue : function(value, old)
    {
      var html = value;
      // [BUG #7871] Bugfix for IE 10 for enabling word-wrap within a flexbox layout. 
      if (qx.core.Environment.get("event.mspointer")) {
        html = "<p>" + value + "</p>";
      }
      this._setHtml(html);
    },


    // property apply
    _applyWrap : function(value, old)
    {
      if (value) {
        this.removeCssClass("no-wrap")
      } else {
        this.addCssClass("no-wrap");
      }
    },


    /**
    * Event handler for the <code>changeEnabled</code> event on the target.
    * @param evt {qx.event.type.Data} the changeEnabled event.
    */
    _changeEnabled: function(evt) {
      if (evt) {
        this.setEnabled(evt.getData());
      }
    },


    /**
     * Setter for the "for" attribute of this label.
     * The "for" attribute specifies which form element a label is bound to.
     *
     * @param elementId {String} The id of the element the label is bound to.
     *
     */
    setLabelFor: function(elementId) {
      if (this.__forWidget) {
        this.__forWidget.removeListener("changeEnabled", this._changeEnabled, this);
      }

      this.__forWidget = qx.ui.mobile.core.Widget.getWidgetById(elementId);

      if (this.__forWidget) {
        this.__forWidget.addListener("changeEnabled", this._changeEnabled, this);
        this.setEnabled(this.__forWidget.getEnabled());
      }

      this._setAttribute("for", elementId);
    },


    /**
     * Locale change event handler
     *
     * @signature function(e)
     * @param e {Event} the change event
     */
    _onChangeLocale : qx.core.Environment.select("qx.dynlocale",
    {
      "true" : function(e)
      {
        var content = this.getValue();
        if (content && content.translate) {
          this.setValue(content.translate());
        }
      },

      "false" : null
    })
  },


  destruct : function() {
    if (this.__forWidget) {
      this.__forWidget.removeListener("changeEnabled", this._changeEnabled, this);
      this.__forWidget = null;
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Tristan Koch (tristankoch)

************************************************************************ */

/**
 * AbstractRequest serves as a base class for {@link qx.io.request.Xhr}
 * and {@link qx.io.request.Jsonp}. It contains methods to conveniently
 * communicate with transports found in {@link qx.bom.request}.
 *
 * The general procedure to derive a new request is to choose a
 * transport (override {@link #_createTransport}) and link
 * the transport’s response (override {@link #_getParsedResponse}).
 * The transport must implement {@link qx.bom.request.IRequest}.
 *
 * To adjust the behavior of {@link #send} override
 * {@link #_getConfiguredUrl} and {@link #_getConfiguredRequestHeaders}.
 */
qx.Class.define("qx.io.request.AbstractRequest",
{
  type : "abstract",

  extend : qx.core.Object,

  /**
   * @param url {String?} The URL of the resource to request.
   */
  construct : function(url)
  {
    this.base(arguments);

    if (url !== undefined) {
      this.setUrl(url);
    }

    this.__requestHeaders = {};

    var transport = this._transport = this._createTransport();
    this._setPhase("unsent");

    this.__onReadyStateChangeBound = qx.lang.Function.bind(this._onReadyStateChange, this);
    this.__onLoadBound = qx.lang.Function.bind(this._onLoad, this);
    this.__onLoadEndBound = qx.lang.Function.bind(this._onLoadEnd, this);
    this.__onAbortBound = qx.lang.Function.bind(this._onAbort, this);
    this.__onTimeoutBound = qx.lang.Function.bind(this._onTimeout, this);
    this.__onErrorBound = qx.lang.Function.bind(this._onError, this);

    transport.onreadystatechange = this.__onReadyStateChangeBound;
    transport.onload = this.__onLoadBound;
    transport.onloadend = this.__onLoadEndBound;
    transport.onabort = this.__onAbortBound;
    transport.ontimeout = this.__onTimeoutBound;
    transport.onerror = this.__onErrorBound;
  },

  events :
  {
    /**
     * Fired on every change of the transport’s readyState.
     */
    "readyStateChange": "qx.event.type.Event",

    /**
     * Fired when request completes without error and transport’s status
     * indicates success.
     */
    "success": "qx.event.type.Event",

    /**
     * Fired when request completes without error.
     */
    "load": "qx.event.type.Event",

    /**
     * Fired when request completes with or without error.
     */
    "loadEnd": "qx.event.type.Event",

    /**
     * Fired when request is aborted.
     */
    "abort": "qx.event.type.Event",

    /**
     * Fired when request reaches timeout limit.
     */
    "timeout": "qx.event.type.Event",

    /**
     * Fired when request completes with error.
     */
    "error": "qx.event.type.Event",

    /**
     * Fired when request completes without error but erroneous HTTP status.
     */
    "statusError": "qx.event.type.Event",

    /**
     * Fired on timeout, error or remote error.
     *
     * This event is fired for convenience. Usually, it is recommended
     * to handle error related events in a more granular approach.
     */
    "fail": "qx.event.type.Event",

    /**
    * Fired on change of the parsed response.
    *
    * This event allows to use data binding with the
    * parsed response as source.
    *
    * For example, to bind the response to the value of a label:
    *
    * <pre class="javascript">
    * // req is an instance of qx.io.request.*,
    * // label an instance of qx.ui.basic.Label
    * req.bind("response", label, "value");
    * </pre>
    *
    * The response is parsed (and therefore changed) only
    * after the request completes successfully. This means
    * that when a new request is made the initial emtpy value
    * is ignored, instead only the final value is bound.
    *
    */
    "changeResponse": "qx.event.type.Data",

    /**
     * Fired on change of the phase.
     */
    "changePhase": "qx.event.type.Data"
  },

  properties :
  {
    /**
     * The URL of the resource to request.
     *
     * Note: Depending on the configuration of the request
     * and/or the transport chosen, query params may be appended
     * automatically.
     */
    url: {
      check: "String"
    },


    /**
     * Timeout limit in milliseconds. Default (0) means no limit.
     */
    timeout: {
      check: "Number",
      nullable: true,
      init: 0
    },

    /**
     * Data to be send as part of the request.
     *
     * Supported types:
     *
     * * String
     * * Map
     * * qooxdoo Object
     *
     * For every supported type except strings, a URL encoded string
     * with unsafe characters escaped is internally generated and sent
     * as part of the request.
     *
     * Depending on the underlying transport and its configuration, the request
     * data is transparently included as URL query parameters or embedded in the
     * request body as form data.
     *
     * If a string is given the user must make sure it is properly formatted and
     * escaped. See {@link qx.util.Serializer#toUriParameter}.
     *
     */
    requestData: {
      check: function(value) {
        return qx.lang.Type.isString(value) ||
               qx.Class.isSubClassOf(value.constructor, qx.core.Object) ||
               qx.lang.Type.isObject(value);
      },
      nullable: true
    },

    /**
     * Authentication delegate.
     *
     * The delegate must implement {@link qx.io.request.authentication.IAuthentication}.
     */
    authentication: {
      check: "qx.io.request.authentication.IAuthentication",
      nullable: true
    }
  },

  members :
  {

    /**
     * Bound handlers.
     */
    __onReadyStateChangeBound: null,
    __onLoadBound: null,
    __onLoadEndBound: null,
    __onAbortBound: null,
    __onTimeoutBound: null,
    __onErrorBound: null,

    /**
     * Parsed response.
     */
    __response: null,

    /**
     * Abort flag.
     */
     __abort: null,

    /**
     * Current phase.
     */
    __phase: null,

    /**
     * Request headers.
     */
    __requestHeaders: null,

    /**
     * Request headers (deprecated).
     */
    __requestHeadersDeprecated: null,

    /**
     * Holds transport.
     */
    _transport: null,

    /*
    ---------------------------------------------------------------------------
      CONFIGURE TRANSPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Create and return transport.
     *
     * This method MUST be overridden, unless the constructor is overridden as
     * well. It is called by the constructor and should return the transport that
     * is to be interfaced.
     *
     * @return {qx.bom.request} Transport.
     */
    _createTransport: function() {
      throw new Error("Abstract method call");
    },

    /**
     * Get configured URL.
     *
     * A configured URL typically includes a query string that
     * encapsulates transport specific settings such as request
     * data or no-cache settings.
     *
     * This method MAY be overridden. It is called in {@link #send}
     * before the request is initialized.
     *
     * @return {String} The configured URL.
     */
    _getConfiguredUrl: function() {},

    /**
     * Get configuration related request headers.
     *
     * This method MAY be overridden to add request headers for features limited
     * to a certain transport.
     *
     * @return {Map} Map of request headers.
     */
    _getConfiguredRequestHeaders: function() {},

    /**
     * Get parsed response.
     *
     * Is called in the {@link #_onReadyStateChange} event handler
     * to parse and store the transport’s response.
     *
     * This method MUST be overridden.
     *
     * @return {String} The parsed response of the request.
     */
    _getParsedResponse: function() {
      throw new Error("Abstract method call");
    },

    /**
     * Get method.
     *
     * This method MAY be overridden. It is called in {@link #send}
     * before the request is initialized.
     *
     * @return {String} The method.
     */
    _getMethod: function() {
      return "GET";
    },

    /**
     * Whether async.
     *
     * This method MAY be overridden. It is called in {@link #send}
     * before the request is initialized.
     *
     * @return {Boolean} Whether to process asynchronously.
     */
    _isAsync: function() {
      return true;
    },

    /*
    ---------------------------------------------------------------------------
      INTERACT WITH TRANSPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Send request.
     */
    send: function() {
      var transport = this._transport,
          url, method, async, serializedData;

      //
      // Open request
      //

      url = this._getConfiguredUrl();

      // Drop fragment (anchor) from URL as per
      // http://www.w3.org/TR/XMLHttpRequest/#the-open-method
      if (/\#/.test(url)) {
        url = url.replace(/\#.*/, "");
      }

      transport.timeout = this.getTimeout();

      // Support transports with enhanced feature set
      method = this._getMethod();
      async = this._isAsync();

      // Open
      if (qx.core.Environment.get("qx.debug.io")) {
        this.debug("Open low-level request with method: " +
          method + ", url: " + url + ", async: " + async);
      }

      transport.open(method, url, async);
      this._setPhase("opened");

      //
      // Send request
      //

      serializedData = this._serializeData(this.getRequestData());

      this._setRequestHeaders();

      // Send
      if (qx.core.Environment.get("qx.debug.io")) {
        this.debug("Send low-level request");
      }
      method == "GET" ? transport.send() : transport.send(serializedData);
      this._setPhase("sent");
    },

    /**
     * Abort request.
     */
    abort: function() {
       if (qx.core.Environment.get("qx.debug.io")) {
         this.debug("Abort request");
       }
       this.__abort = true;

       // Update phase to "abort" before user handler are invoked [BUG #5485]
       this.__phase = "abort";

       this._transport.abort();
    },

    /*
    ---------------------------------------------------------------------------
     REQUEST HEADERS
    ---------------------------------------------------------------------------
    */

    /**
     * Apply configured request headers to transport.
     *
     * This method MAY be overridden to customize application of request headers
     * to transport.
     */
    _setRequestHeaders: function() {
      var transport = this._transport,
          requestHeaders = this._getAllRequestHeaders();

      for (var key in requestHeaders) {
        transport.setRequestHeader(key, requestHeaders[key]);
      }

    },

    /**
     * Get all request headers.
     *
     * @return {Map} All request headers.
     */
    _getAllRequestHeaders: function() {
      var requestHeaders = {};
      // Transport specific headers
      qx.lang.Object.mergeWith(requestHeaders, this._getConfiguredRequestHeaders());
      // Authentication delegate
      qx.lang.Object.mergeWith(requestHeaders, this.__getAuthRequestHeaders());
      // User-defined, requestHeaders property (deprecated)
      qx.lang.Object.mergeWith(requestHeaders, this.__requestHeadersDeprecated);
      // User-defined
      qx.lang.Object.mergeWith(requestHeaders, this.__requestHeaders);

      return requestHeaders;
    },

    /**
    * Retrieve authentication headers from auth delegate.
    *
    * @return {Map} Authentication related request headers.
    */
    __getAuthRequestHeaders: function() {
      var auth = this.getAuthentication(),
          headers = {};

      if (auth) {
        auth.getAuthHeaders().forEach(function(header) {
          headers[header.key] = header.value;
        });
        return headers;
      }
    },

    /**
     * Set a request header.
     *
     * Note: Setting request headers has no effect after the request was send.
     *
     * @param key {String} Key of the header.
     * @param value {String} Value of the header.
     */
    setRequestHeader: function(key, value) {
      this.__requestHeaders[key] = value;
    },

    /**
     * Get a request header.
     *
     * @param key {String} Key of the header.
     * @return {String} The value of the header.
     */
    getRequestHeader: function(key) {
       return this.__requestHeaders[key];
    },

    /**
     * Remove a request header.
     *
     * Note: Removing request headers has no effect after the request was send.
     *
     * @param key {String} Key of the header.
     */
    removeRequestHeader: function(key) {
      if (this.__requestHeaders[key]) {
       delete this.__requestHeaders[key];
      }
    },


    /*
    ---------------------------------------------------------------------------
     QUERY TRANSPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Get low-level transport.
     *
     * Note: To be used with caution!
     *
     * This method can be used to query the transport directly,
     * but should be used with caution. Especially, it
     * is not advisable to call any destructive methods
     * such as <code>open</code> or <code>send</code>.
     *
     * @return {Object} An instance of a class found in
     *  <code>qx.bom.request.*</code>
     */

     // This method mainly exists so that some methods found in the
     // low-level transport can be deliberately omitted here,
     // but still be accessed should it be absolutely necessary.
     //
     // Valid use cases include to query the transport’s responseXML
     // property if performance is critical and any extra parsing
     // should be avoided at all costs.
     //
    getTransport: function() {
      return this._transport;
    },

    /**
     * Get current ready state.
     *
     * States can be:
     * UNSENT:           0,
     * OPENED:           1,
     * HEADERS_RECEIVED: 2,
     * LOADING:          3,
     * DONE:             4
     *
     * @return {Number} Ready state.
     */
    getReadyState: function() {
      return this._transport.readyState;
    },

    /**
     * Get current phase.
     *
     * A more elaborate version of {@link #getReadyState}, this method indicates
     * the current phase of the request. Maps to stateful (i.e. deterministic)
     * events (success, abort, timeout, statusError) and intermediate
     * readyStates (unsent, configured, loading, load).
     *
     * When the requests is successful, it progresses the states:<br>
     * 'unsent', 'opened', 'sent', 'loading', 'load', 'success'
     *
     * In case of failure, the final state is one of:<br>
     * 'abort', 'timeout', 'statusError'
     *
     * For each change of the phase, a {@link #changePhase} data event is fired.
     *
     * @return {String} Current phase.
     *
     */
    getPhase: function() {
      return this.__phase;
    },

    /**
     * Get status code.
     *
     * @return {Number} The transport’s status code.
     */
    getStatus: function() {
      return this._transport.status;
    },

    /**
     * Get status text.
     *
     * @return {String} The transport’s status text.
     */
    getStatusText: function() {
      return this._transport.statusText;
    },

    /**
     * Get raw (unprocessed) response.
     *
     * @return {String} The raw response of the request.
     */
    getResponseText: function() {
      return this._transport.responseText;
    },

    /**
     * Get all response headers from response.
     *
     * @return {String} All response headers.
     */
    getAllResponseHeaders: function() {
      return this._transport.getAllResponseHeaders();
    },

    /**
     * Get a single response header from response.
     *
     * @param key {String}
     *   Key of the header to get the value from.
     * @return {String}
     *   Response header.
     */
    getResponseHeader: function(key) {
      return this._transport.getResponseHeader(key);
    },

    /**
     * Override the content type response header from response.
     *
     * @param contentType {String}
     *   Content type for overriding.
     * @see qx.bom.request.Xhr#overrideMimeType
     */
    overrideResponseContentType: function(contentType) {
      return this._transport.overrideMimeType(contentType);
    },

    /**
     * Get the content type response header from response.
     *
     * @return {String}
     *   Content type response header.
     */
    getResponseContentType: function() {
      return this.getResponseHeader("Content-Type");
    },

    /**
     * Whether request completed (is done).
     */
    isDone: function() {
      return this.getReadyState() === 4;
    },

    /*
    ---------------------------------------------------------------------------
      RESPONSE
    ---------------------------------------------------------------------------
    */

    /**
     * Get parsed response.
     *
     * @return {String} The parsed response of the request.
     */
    getResponse: function() {
      return this.__response;
    },

    /**
     * Set response.
     *
     * @param response {String} The parsed response of the request.
     */
    _setResponse: function(response) {
      var oldResponse = response;

      if (this.__response !== response) {
        this.__response = response;
        this.fireEvent("changeResponse", qx.event.type.Data, [this.__response, oldResponse]);
      }
    },

    /*
    ---------------------------------------------------------------------------
      EVENT HANDLING
    ---------------------------------------------------------------------------
    */

    /**
     * Handle "readyStateChange" event.
     */
    _onReadyStateChange: function() {
      var readyState = this.getReadyState();

      if (qx.core.Environment.get("qx.debug.io")) {
        this.debug("Fire readyState: " + readyState);
      }

      this.fireEvent("readyStateChange");

      // Transport switches to readyState DONE on abort and may already
      // have successful HTTP status when response is served from cache.
      //
      // Not fire custom event "loading" (or "success", when cached).
      if (this.__abort) {
        return;
      }

      if (readyState === 3) {
        this._setPhase("loading");
      }

      if (this.isDone()) {
        this.__onReadyStateDone();
      }
    },

    /**
     * Called internally when readyState is DONE.
     */
    __onReadyStateDone: function() {
      if (qx.core.Environment.get("qx.debug.io")) {
        this.debug("Request completed with HTTP status: " + this.getStatus());
      }

      // Event "load" fired in onLoad
      this._setPhase("load");

      // Successful HTTP status
      if (qx.util.Request.isSuccessful(this.getStatus())) {

        // Parse response
        if (qx.core.Environment.get("qx.debug.io")) {
          this.debug("Response is of type: '" + this.getResponseContentType() + "'");
        }

        this._setResponse(this._getParsedResponse());

        this._fireStatefulEvent("success");

      // Erroneous HTTP status
      } else {

        try {
          this._setResponse(this._getParsedResponse());
        } catch (e) {
          // ignore if it does not work
        }

        // A remote error failure
        if (this.getStatus() !== 0) {
          this._fireStatefulEvent("statusError");
          this.fireEvent("fail");
        }
      }
    },

    /**
     * Handle "load" event.
     */
    _onLoad: function() {
      this.fireEvent("load");
    },

    /**
     * Handle "loadEnd" event.
     */
    _onLoadEnd: function() {
      this.fireEvent("loadEnd");
    },

    /**
     * Handle "abort" event.
     */
    _onAbort: function() {
      this._fireStatefulEvent("abort");
    },

    /**
     * Handle "timeout" event.
     */
    _onTimeout: function() {
      this._fireStatefulEvent("timeout");

      // A network error failure
      this.fireEvent("fail");
    },

    /**
     * Handle "error" event.
     */
    _onError: function() {
      this.fireEvent("error");

      // A network error failure
      this.fireEvent("fail");
    },

    /*
    ---------------------------------------------------------------------------
      INTERNAL / HELPERS
    ---------------------------------------------------------------------------
    */

    /**
     * Fire stateful event.
     *
     * Fires event and sets phase to name of event.
     *
     * @param evt {String} Name of the event to fire.
     */
    _fireStatefulEvent: function(evt) {
      if (qx.core.Environment.get("qx.debug")) {
        qx.core.Assert.assertString(evt);
      }
      this._setPhase(evt);
      this.fireEvent(evt);
    },

    /**
     * Set phase.
     *
     * @param phase {String} The phase to set.
     */
    _setPhase: function(phase) {
      var previousPhase = this.__phase;

      if (qx.core.Environment.get("qx.debug")) {
        qx.core.Assert.assertString(phase);
        qx.core.Assert.assertMatch(phase,
          /^(unsent)|(opened)|(sent)|(loading)|(load)|(success)|(abort)|(timeout)|(statusError)$/);
      }

      this.__phase = phase;
      this.fireDataEvent("changePhase", phase, previousPhase);
    },

    /**
     * Serialize data.
     *
     * @param data {String|Map|qx.core.Object} Data to serialize.
     * @return {String|null} Serialized data.
     */
    _serializeData: function(data) {
      var isPost = typeof this.getMethod !== "undefined" && this.getMethod() == "POST",
          isJson = (/application\/.*\+?json/).test(this.getRequestHeader("Content-Type"));

      if (!data) {
        return null;
      }

      if (qx.lang.Type.isString(data)) {
        return data;
      }

      if (qx.Class.isSubClassOf(data.constructor, qx.core.Object)) {
        return qx.util.Serializer.toUriParameter(data);
      }

      if (isJson && (qx.lang.Type.isObject(data) || qx.lang.Type.isArray(data))) {
        return qx.lang.Json.stringify(data);
      }

      if (qx.lang.Type.isObject(data)) {
        return qx.util.Uri.toParameter(data, isPost);
      }
    }
  },

  environment:
  {
    "qx.debug.io": false
  },

  destruct: function()
  {
    var transport = this._transport,
        noop = function() {};

    if (this._transport) {
      transport.onreadystatechange = transport.onload = transport.onloadend =
      transport.onabort = transport.ontimeout = transport.onerror = noop;

      transport.dispose();
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Tristan Koch (tristankoch)
     * Richard Sternagel (rsternagel)

************************************************************************ */

/**
 * Static helpers for handling HTTP requests.
 */
qx.Bootstrap.define("qx.util.Request",
{
  statics:
  {
    /**
     * Whether URL given points to resource that is cross-domain,
     * i.e. not of same origin.
     *
     * @param url {String} URL.
     * @return {Boolean} Whether URL is cross domain.
     */
    isCrossDomain: function(url) {
      var result = qx.util.Uri.parseUri(url),
          location = window.location;

      if (!location) {
        return false;
      }

      var protocol = location.protocol;

      // URL is relative in the sence that it points to origin host
      if (!(url.indexOf("//") !== -1)) {
        return false;
      }

      if (protocol.substr(0, protocol.length-1) == result.protocol &&
          location.host === result.host &&
          location.port === result.port) {
        return false;
      }

      return true;
    },

    /**
     * Determine if given HTTP status is considered successful.
     *
     * @param status {Number} HTTP status.
     * @return {Boolean} Whether status is considered successful.
     */
    isSuccessful: function(status) {
      return (status >= 200 && status < 300 || status === 304);
    },

    /**
     * Determine if given HTTP method is valid.
     *
     * @param method {String} HTTP method.
     * @return {Boolean} Whether method is a valid HTTP method.
     */
    isMethod: function(method) {
      var knownMethods = ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS", "TRACE", "CONNECT", "PATCH"];
      return (knownMethods.indexOf(method) !== -1) ? true : false;
    },

    /**
     * Request body is ignored for HTTP method GET and HEAD.
     *
     * See http://www.w3.org/TR/XMLHttpRequest2/#the-send-method.
     *
     * @param method {String} The HTTP method.
     * @return {Boolean} Whether request may contain body.
     */
    methodAllowsRequestBody: function(method) {
      return !((/^(GET|HEAD)$/).test(method));
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * This is an util class responsible for serializing qooxdoo objects.
 *
 * @ignore(qx.data, qx.data.IListData)
 * @ignore(qx.locale, qx.locale.LocalizedString)
 */
qx.Class.define("qx.util.Serializer",
{
  statics :
  {

    /**
     * Serializes the properties of the given qooxdoo object. To get the
     * serialization working, every property needs to have a string
     * representation because the value of the property will be concatenated to the
     * serialized string.
     *
     * @param object {qx.core.Object} Any qooxdoo object
     * @param qxSerializer {Function} Function used for serializing qooxdoo
     *   objects stored in the propertys of the object. Check for the type of
     *   classes <ou want to serialize and return the serialized value. In all
     *   other cases, just return nothing.
     * @param dateFormat {qx.util.format.DateFormat} If a date formater is given,
     *   the format method of this given formater is used to convert date
     *   objects into strings.
     * @return {String} The serialized object.
     */
    toUriParameter : function(object, qxSerializer, dateFormat)
    {
      var result = "";
      var properties = qx.util.PropertyUtil.getAllProperties(object.constructor);

      for (var name in properties) {
        // ignore property groups
        if (properties[name].group != undefined) {
          continue;
        }
        var value = object["get" + qx.lang.String.firstUp(name)]();

        // handle arrays
        if (qx.lang.Type.isArray(value)) {
          var isdataArray = qx.data && qx.data.IListData &&
            qx.Class.hasInterface(value && value.constructor, qx.data.IListData);
          for (var i = 0; i < value.length; i++) {
            var valueAtI = isdataArray ? value.getItem(i) : value[i];
            result += this.__toUriParameter(name, valueAtI, qxSerializer);
          }
        } else if (qx.lang.Type.isDate(value) && dateFormat != null) {
          result += this.__toUriParameter(
            name, dateFormat.format(value), qxSerializer
          );
        } else {
          result += this.__toUriParameter(name, value, qxSerializer);
        }
      }
      return result.substring(0, result.length - 1);
    },


    /**
     * Helper method for {@link #toUriParameter}. Check for qooxdoo objects
     * and returns the serialized name value pair for the given parameter.
     *
     * @param name {String} The name of the value
     * @param value {var} The value itself
     * @param qxSerializer {Function} The serializer for qooxdoo objects.
     * @return {String} The serialized name value pair.
     */
    __toUriParameter : function(name, value, qxSerializer)
    {

      if (value && value.$$type == "Class") {
        value = value.classname;
      }

      if (value && (value.$$type == "Interface" || value.$$type == "Mixin")) {
        value = value.name;
      }

      if (value instanceof qx.core.Object && qxSerializer != null) {
        var encValue = encodeURIComponent(qxSerializer(value));
        if (encValue === undefined) {
          var encValue = encodeURIComponent(value);
        }
      } else {
        var encValue = encodeURIComponent(value);
      }
      return encodeURIComponent(name) + "=" + encValue + "&";
    },


    /**
     * Serializes the properties of the given qooxdoo object into a native
     * object.
     *
     * @param object {qx.core.Object}
     *   Any qooxdoo object
     *
     * @param qxSerializer {Function}
     *   Function used for serializing qooxdoo objects stored in the propertys
     *   of the object. Check for the type of classes you want to serialize
     *   and return the serialized value. In all other cases, just return
     *   nothing.
     * @param dateFormat {qx.util.format.DateFormat} If a date formater is given,
     *   the format method of this given formater is used to convert date
     *   objects into strings.
     * @return {String}
     *   The serialized object.
     */
    toNativeObject : function(object, qxSerializer, dateFormat)
    {
      var result;

      // null or undefined
      if (object == null)
      {
        return null;
      }

      // data array
      if (qx.data && qx.data.IListData && qx.Class.hasInterface(object.constructor, qx.data.IListData))
      {
        result = [];
        for (var i = 0; i < object.getLength(); i++)
        {
          result.push(qx.util.Serializer.toNativeObject(
            object.getItem(i), qxSerializer, dateFormat)
          );
        }

        return result;
      }

      // other arrays
      if (qx.lang.Type.isArray(object))
      {
        result = [];
        for (var i = 0; i < object.length; i++)
        {
          result.push(qx.util.Serializer.toNativeObject(
            object[i], qxSerializer, dateFormat)
          );
        }

        return result;
      }

      // return names for qooxdoo classes
      if (object.$$type == "Class") {
        return object.classname;
      }

      // return names for qooxdoo interfaces and mixins
      if (object.$$type == "Interface" || object.$$type == "Mixin") {
        return object.name;
      }

      // qooxdoo object
      if (object instanceof qx.core.Object)
      {
        if (qxSerializer != null)
        {
          var returnValue = qxSerializer(object);

          // if we have something returned, return that
          if (returnValue != undefined)
          {
            return returnValue;
          }

          // continue otherwise
        }

        result = {};

        var properties =
          qx.util.PropertyUtil.getAllProperties(object.constructor);

        for (var name in properties)
        {
          // ignore property groups
          if (properties[name].group != undefined)
          {
            continue;
          }

          var value = object["get" + qx.lang.String.firstUp(name)]();
          result[name] = qx.util.Serializer.toNativeObject(
            value, qxSerializer, dateFormat
          );
        }

        return result;
      }

      // date objects with date format
      if (qx.lang.Type.isDate(object) && dateFormat != null) {
        return dateFormat.format(object);
      }

      // localized strings
      if (qx.locale && qx.locale.LocalizedString && object instanceof qx.locale.LocalizedString) {
        return object.toString();
      }

      // JavaScript objects
      if (qx.lang.Type.isObject(object))
      {
        result = {};

        for (var key in object)
        {
          result[key] = qx.util.Serializer.toNativeObject(
            object[key], qxSerializer, dateFormat
          );
        }

        return result;
      }

      // all other stuff, including String, Date, RegExp
      return object;
    },


    /**
     * Serializes the properties of the given qooxdoo object into a json object.
     *
     * @param object {qx.core.Object} Any qooxdoo object
     * @param qxSerializer {Function?} Function used for serializing qooxdoo
     *   objects stored in the propertys of the object. Check for the type of
     *   classes <ou want to serialize and return the serialized value. In all
     *   other cases, just return nothing.
     * @param dateFormat {qx.util.format.DateFormat?} If a date formater is given,
     *   the format method of this given formater is used to convert date
     *   objects into strings.
     * @return {String} The serialized object.
     */
    toJson : function(object, qxSerializer, dateFormat) {
      var result = "";

      // null or undefined
      if (object == null) {
        return "null";
      }

      // data array
      if (qx.data && qx.data.IListData && qx.Class.hasInterface(object.constructor, qx.data.IListData)) {
        result += "[";
        for (var i = 0; i < object.getLength(); i++) {
          result += qx.util.Serializer.toJson(object.getItem(i), qxSerializer, dateFormat) + ",";
        }
        if (result != "[") {
          result = result.substring(0, result.length - 1);
        }
        return result + "]";
      }

      // other arrays
      if (qx.lang.Type.isArray(object)) {
        result += "[";
        for (var i = 0; i < object.length; i++) {
          result += qx.util.Serializer.toJson(object[i], qxSerializer, dateFormat) + ",";
        }
        if (result != "[") {
          result = result.substring(0, result.length - 1);
        }
        return result + "]";
      }

      // return names for qooxdoo classes
      if (object.$$type == "Class") {
        return '"' + object.classname + '"';
      }

      // return names for qooxdoo interfaces and mixins
      if (object.$$type == "Interface" || object.$$type == "Mixin") {
        return '"' + object.name + '"';
      }


      // qooxdoo object
      if (object instanceof qx.core.Object) {
        if (qxSerializer != null) {
          var returnValue = qxSerializer(object);
          // if we have something returned, ruturn that
          if (returnValue != undefined) {
            return '"' + returnValue + '"';
          }
          // continue otherwise
        }
        result += "{";
        var properties = qx.util.PropertyUtil.getAllProperties(object.constructor);
        for (var name in properties) {
          // ignore property groups
          if (properties[name].group != undefined) {
            continue;
          }
          var value = object["get" + qx.lang.String.firstUp(name)]();
          result += '"' + name + '":' + qx.util.Serializer.toJson(value, qxSerializer, dateFormat) + ",";
        }
        if (result != "{") {
          result = result.substring(0, result.length - 1);
        }
        return result + "}";
      }

      // localized strings
      if (qx.locale && qx.locale.LocalizedString && object instanceof qx.locale.LocalizedString) {
        object = object.toString();
        // no return here because we want to have the string checks as well!
      }

      // date objects with formater
      if (qx.lang.Type.isDate(object) && dateFormat != null) {
        return '"' + dateFormat.format(object) + '"';
      }

      // javascript objects
      if (qx.lang.Type.isObject(object)) {
        result += "{";
        for (var key in object) {
          result += '"' + key + '":' +
                    qx.util.Serializer.toJson(object[key], qxSerializer, dateFormat) + ",";
        }
        if (result != "{") {
          result = result.substring(0, result.length - 1);
        }
        return result + "}";
      }

      // strings
      if (qx.lang.Type.isString(object)) {
        // escape
        object = object.replace(/([\\])/g, '\\\\');
        object = object.replace(/(["])/g, '\\"');
        object = object.replace(/([\r])/g, '\\r');
        object = object.replace(/([\f])/g, '\\f');
        object = object.replace(/([\n])/g, '\\n');
        object = object.replace(/([\t])/g, '\\t');
        object = object.replace(/([\b])/g, '\\b');

        return '"' + object + '"';
      }

      // Date and RegExp
      if (qx.lang.Type.isDate(object) || qx.lang.Type.isRegExp(object)) {
        return '"' + object + '"';
      }

      // all other stuff
      return object + "";
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Tristan Koch (tristankoch)

************************************************************************ */

/**
 * Send HTTP requests and handle responses using the HTTP client API.
 *
 * Configuration of the request is done with properties. Events are fired for
 * various states in the life cycle of a request, such as "success". Request
 * data is transparently processed.
 *
 * Here is how to request a JSON file and listen to the "success" event:
 *
 * <pre class="javascript">
 * var req = new qx.io.request.Xhr("/some/path/file.json");
 *
 * req.addListener("success", function(e) {
 *   var req = e.getTarget();
 *
 *   // Response parsed according to the server's
 *   // response content type, e.g. JSON
 *   req.getResponse();
 * }, this);
 *
 * // Send request
 * req.send();
 * </pre>
 *
 * Some noteable features:
 *
 * * Abstraction of low-level request
 * * Convenient setup using properties
 * * Fine-grained events
 * * Symbolic phases
 * * Transparent processing of request data
 * * Stream-lined authentication
 * * Automagic parsing of response based on content type
 *
 * Cross-origin requests are supported, but require browser support
 * (see <a href="http://caniuse.com/#search=CORS">caniuse.com</a>) and backend configuration
 * (see <a href="https://developer.mozilla.org/en-US/docs/docs/HTTP/Access_control_CORS>MDN</a>).
 * Note that IE's <code>XDomainRequest</code> is not currently supported.
 * For a cross-browser alternative, consider {@link qx.io.request.Jsonp}.
 *
 * In order to debug requests, set the environment flag
 * <code>qx.debug.io</code>.
 *
 * Internally uses {@link qx.bom.request.Xhr}.
 */
qx.Class.define("qx.io.request.Xhr",
{
  extend: qx.io.request.AbstractRequest,

  /**
   * @param url {String?} The URL of the resource to request.
   * @param method {String?} The HTTP method.
   */
  construct: function(url, method) {
    if (method !== undefined) {
      this.setMethod(method);
    }

    this.base(arguments, url);
    this._parser = this._createResponseParser();
  },

  // Only document events with transport specific details.
  // For a complete list of events, refer to AbstractRequest.

  events:
  {
    /**
     * Fired on every change of the transport’s readyState.
     *
     * See {@link qx.bom.request.Xhr} for available readyStates.
     */
    "readyStateChange": "qx.event.type.Event",

    /**
    * Fired when request completes without eror and transport’s status
    * indicates success.
     *
     * Refer to {@link qx.util.Request#isSuccessful} for a list of HTTP
     * status considered successful.
     */
    "success": "qx.event.type.Event",

    /**
     * Fired when request completes without error.
     *
     * Every request not canceled or aborted completes. This means that
     * even requests receiving a response with erroneous HTTP status
     * fire a "load" event. If you are only interested in successful
     * responses, listen to the {@link #success} event instead.
     */
    "load": "qx.event.type.Event",

    /**
     * Fired when request completes without error but erroneous HTTP status.
     *
     * Refer to {@link qx.util.Request#isSuccessful} for a list of HTTP
     * status considered successful.
     */
    "statusError": "qx.event.type.Event"
  },

  properties:
  {
    /**
     * The HTTP method.
     */
    method: {
      init: "GET"
    },

    /**
     * Whether the request should be executed asynchronously.
     */
    async: {
      check: "Boolean",
      init: true
    },

    /**
     * The content type to accept. By default, every content type
     * is accepted.
     *
     * Note: Some backends send distinct representations of the same
     * resource depending on the content type accepted. For instance,
     * a backend may respond with either a JSON (the accept header
     * indicates so) or a HTML representation (the default, no accept
     * header given).
     */
    accept: {
      check: "String",
      nullable: true
    },

    /**
     * Whether to allow request to be answered from cache.
     *
     * Allowed values:
     *
     * * <code>true</code>: Allow caching (Default)
     * * <code>false</code>: Prohibit caching. Appends nocache parameter to URL.
     * * <code>String</code>: Any Cache-Control request directive
     *
     * If a string is given, it is inserted in the request's Cache-Control
     * header. A request’s Cache-Control header may contain a number of directives
     * controlling the behavior of any caches in between client and origin
     * server.
     *
     * * <code>"no-cache"</code>: Force caches to submit request in order to
     *   validate the freshness of the representation. Note that the requested
     *   resource may still be served from cache if the representation is
     *   considered fresh. Use this directive to ensure freshness but save
     *   bandwidth when possible.
     * * <code>"no-store"</code>: Do not keep a copy of the representation under
     *   any conditions.
     *
     * See <a href="http://www.mnot.net/cache_docs/#CACHE-CONTROL">
     * Caching tutorial</a> for an excellent introduction to Caching in general.
     * Refer to the corresponding section in the
     * <a href="http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.9">
     * HTTP 1.1 specification</a> for more details and advanced directives.
     *
     * It is recommended to choose an appropriate Cache-Control directive rather
     * than prohibit caching using the nocache parameter.
     */
    cache: {
      check: function(value) {
        return qx.lang.Type.isBoolean(value) ||
          qx.lang.Type.isString(value);
      },
      init: true
    }
  },

  members:
  {

    /**
     * @type {Function} Parser.
     */
    _parser: null,

    /*
    ---------------------------------------------------------------------------
      CONFIGURE TRANSPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Create XHR transport.
     *
     * @return {qx.bom.request.Xhr} Transport.
     */
    _createTransport: function() {
      return new qx.bom.request.Xhr();
    },

    /**
     * Get configured URL.
     *
     * Append request data to URL if HTTP method is GET. Append random
     * string to URL if required by value of {@link #cache}.
     *
     * @return {String} The configured URL.
     */
    _getConfiguredUrl: function() {
      var url = this.getUrl(),
          serializedData;

      if (this.getMethod() === "GET" && this.getRequestData()) {
        serializedData = this._serializeData(this.getRequestData());
        url = qx.util.Uri.appendParamsToUrl(url, serializedData);
      }

      if (this.getCache() === false) {
        // Make sure URL cannot be served from cache and new request is made
        url = qx.util.Uri.appendParamsToUrl(url, {nocache: new Date().valueOf()});
      }

      return url;
    },

    // overridden
    _getConfiguredRequestHeaders: function() {
      var headers = {},
          isAllowsBody = qx.util.Request.methodAllowsRequestBody(this.getMethod());

      // Follow convention to include X-Requested-With header when same origin
      if (!qx.util.Request.isCrossDomain(this.getUrl())) {
        headers["X-Requested-With"] = "XMLHttpRequest";
      }

      // Include Cache-Control header if configured
      if (qx.lang.Type.isString(this.getCache())) {
        headers["Cache-Control"] = this.getCache();
      }

      // By default, set content-type urlencoded for requests with body
      if (this.getRequestData() !== "null" && isAllowsBody) {
        headers["Content-Type"] = "application/x-www-form-urlencoded";
      }

      // What representations to accept
      if (this.getAccept()) {
        if (qx.core.Environment.get("qx.debug.io")) {
          this.debug("Accepting: '" + this.getAccept() + "'");
        }
        headers["Accept"] = this.getAccept();
      }

      return headers;
    },

    // overridden
    _getMethod: function() {
      return this.getMethod();
    },

    // overridden
    _isAsync: function() {
      return this.isAsync();
    },

    /*
    ---------------------------------------------------------------------------
      PARSING
    ---------------------------------------------------------------------------
    */

    /**
     * Create response parser.
     *
     * @return {qx.util.ResponseParser} parser.
     */
    _createResponseParser: function() {
        return new qx.util.ResponseParser();
    },

    /**
     * Returns response parsed with parser determined by content type.
     *
     * @return {String|Object} The parsed response of the request.
     */
    _getParsedResponse: function() {
      var response = this._transport.responseText,
          contentType = this.getResponseContentType() || "";

      return this._parser.parse(response, contentType);
    },

    /**
     * Set parser used to parse response once request has
     * completed successfully.
     *
     * @see qx.util.ResponseParser#setParser
     *
     * @param parser {String|Function}
     * @return {Function} The parser function
     */
    setParser: function(parser) {
      return this._parser.setParser(parser);
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Tristan Koch (tristankoch)

************************************************************************ */

/**
 * A wrapper of the XMLHttpRequest host object (or equivalent). The interface is
 * similar to <a href="http://www.w3.org/TR/XMLHttpRequest/">XmlHttpRequest</a>.
 *
 * Hides browser inconsistencies and works around bugs found in popular
 * implementations.
 *
 * <div class="desktop">
 * Example:
 *
 * <pre class="javascript">
 *  var req = new qx.bom.request.Xhr();
 *  req.onload = function() {
 *    // Handle data received
 *    req.responseText;
 *  }
 *
 *  req.open("GET", url);
 *  req.send();
 * </pre>
 * </div>
 *
 * @ignore(XDomainRequest)
 * @ignore(qx.event, qx.event.GlobalError.*)
 *
 * @require(qx.bom.request.Xhr#open)
 * @require(qx.bom.request.Xhr#send)
 * @require(qx.bom.request.Xhr#on)
 * @require(qx.bom.request.Xhr#onreadystatechange)
 * @require(qx.bom.request.Xhr#onload)
 * @require(qx.bom.request.Xhr#onloadend)
 * @require(qx.bom.request.Xhr#onerror)
 * @require(qx.bom.request.Xhr#onabort)
 * @require(qx.bom.request.Xhr#ontimeout)
 * @require(qx.bom.request.Xhr#setRequestHeader)
 * @require(qx.bom.request.Xhr#getAllResponseHeaders)
 * @require(qx.bom.request.Xhr#getRequest)
 * @require(qx.bom.request.Xhr#overrideMimeType)
 * @require(qx.bom.request.Xhr#dispose)
 * @require(qx.bom.request.Xhr#isDisposed)
 *
 * @group (IO)
 */
qx.Bootstrap.define("qx.bom.request.Xhr",
{

  extend: Object,

  construct: function() {
    var boundFunc = qx.Bootstrap.bind(this.__onNativeReadyStateChange, this);

    // GlobalError shouldn't be included in qx.Website builds so use it
    // if it's available but otherwise ignore it (see ignore stated above).
    if (qx.event && qx.event.GlobalError && qx.event.GlobalError.observeMethod) {
      this.__onNativeReadyStateChangeBound = qx.event.GlobalError.observeMethod(boundFunc);
    } else {
      this.__onNativeReadyStateChangeBound = boundFunc;
    }

    this.__onNativeAbortBound = qx.Bootstrap.bind(this.__onNativeAbort, this);
    this.__onTimeoutBound = qx.Bootstrap.bind(this.__onTimeout, this);

    this.__initNativeXhr();
    this._emitter = new qx.event.Emitter();

    // BUGFIX: IE
    // IE keeps connections alive unless aborted on unload
    if (window.attachEvent) {
      this.__onUnloadBound = qx.Bootstrap.bind(this.__onUnload, this);
      window.attachEvent("onunload", this.__onUnloadBound);
    }
  },

  statics :
  {
    UNSENT: 0,
    OPENED: 1,
    HEADERS_RECEIVED: 2,
    LOADING: 3,
    DONE: 4
  },


  events : {
    /** Fired at ready state changes. */
    "readystatechange" : "qx.bom.request.Xhr",

    /** Fired on error. */
    "error" : "qx.bom.request.Xhr",

    /** Fired at loadend. */
    "loadend" : "qx.bom.request.Xhr",

    /** Fired on timeouts. */
    "timeout" : "qx.bom.request.Xhr",

    /** Fired when the request is aborted. */
    "abort" : "qx.bom.request.Xhr",

    /** Fired on successful retrieval. */
    "load" : "qx.bom.request.Xhr"
  },


  members :
  {
    /*
    ---------------------------------------------------------------------------
      PUBLIC
    ---------------------------------------------------------------------------
    */

    /**
     * @type {Number} Ready state.
     *
     * States can be:
     * UNSENT:           0,
     * OPENED:           1,
     * HEADERS_RECEIVED: 2,
     * LOADING:          3,
     * DONE:             4
     */
    readyState: 0,

    /**
     * @type {String} The response of the request as text.
     */
    responseText: "",

    /**
     * @type {Object} The response of the request as a Document object.
     */
    responseXML: null,

    /**
     * @type {Number} The HTTP status code.
     */
    status: 0,

    /**
     * @type {String} The HTTP status text.
     */
    statusText: "",

    /**
     * @type {Number} Timeout limit in milliseconds.
     *
     * 0 (default) means no timeout. Not supported for synchronous requests.
     */
    timeout: 0,

    /**
     * Initializes (prepares) request.
     *
     * @ignore(XDomainRequest)
     *
     * @param method {String?"GET"}
     *  The HTTP method to use.
     * @param url {String}
     *  The URL to which to send the request.
     * @param async {Boolean?true}
     *  Whether or not to perform the operation asynchronously.
     * @param user {String?null}
     *  Optional user name to use for authentication purposes.
     * @param password {String?null}
     *  Optional password to use for authentication purposes.
     */
    open: function(method, url, async, user, password) {
      this.__checkDisposed();

      // Mimick native behavior
      if (typeof url === "undefined") {
        throw new Error("Not enough arguments");
      } else if (typeof method === "undefined") {
        method = "GET";
      }

      // Reset flags that may have been set on previous request
      this.__abort = false;
      this.__send = false;
      this.__conditional = false;

      // Store URL for later checks
      this.__url = url;

      if (typeof async == "undefined") {
        async = true;
      }
      this.__async = async;

      // BUGFIX
      // IE < 9 and FF < 3.5 cannot reuse the native XHR to issue many requests
      if (!this.__supportsManyRequests() && this.readyState > qx.bom.request.Xhr.UNSENT) {
        // XmlHttpRequest Level 1 requires open() to abort any pending requests
        // associated to the object. Since we're dealing with a new object here,
        // we have to emulate this behavior. Moreover, allow old native XHR to be garbage collected
        //
        // Dispose and abort.
        //
        this.dispose();

        // Replace the underlying native XHR with a new one that can
        // be used to issue new requests.
        this.__initNativeXhr();
      }

      // Restore handler in case it was removed before
      this.__nativeXhr.onreadystatechange = this.__onNativeReadyStateChangeBound;

      try {
        if (qx.core.Environment.get("qx.debug.io")) {
          qx.Bootstrap.debug(qx.bom.request.Xhr, "Open native request with method: " +
            method + ", url: " + url + ", async: " + async);
        }

        this.__nativeXhr.open(method, url, async, user, password);

      // BUGFIX: IE, Firefox < 3.5
      // Some browsers do not support Cross-Origin Resource Sharing (CORS)
      // for XMLHttpRequest. Instead, an exception is thrown even for async requests
      // if URL is cross-origin (as per XHR level 1). Use the proprietary XDomainRequest
      // if available (supports CORS) and handle error (if there is one) this
      // way. Otherwise just assume network error.
      //
      // Basically, this allows to detect network errors.
      } catch(OpenError) {

        // Only work around exceptions caused by cross domain request attempts
        if (!qx.util.Request.isCrossDomain(url)) {
          // Is same origin
          throw OpenError;
        }

        if (!this.__async) {
          this.__openError = OpenError;
        }

        if (this.__async) {
          // Try again with XDomainRequest
          // (Success case not handled on purpose)
          // - IE 9
          if (window.XDomainRequest) {
            this.readyState = 4;
            this.__nativeXhr = new XDomainRequest();
            this.__nativeXhr.onerror = qx.Bootstrap.bind(function() {
              this._emit("readystatechange");
              this._emit("error");
              this._emit("loadend");
            }, this);

            if (qx.core.Environment.get("qx.debug.io")) {
              qx.Bootstrap.debug(qx.bom.request.Xhr, "Retry open native request with method: " +
                method + ", url: " + url + ", async: " + async);
            }
            this.__nativeXhr.open(method, url, async, user, password);
            return;
          }

          // Access denied
          // - IE 6: -2146828218
          // - IE 7: -2147024891
          // - Legacy Firefox
          window.setTimeout(qx.Bootstrap.bind(function() {
            if (this.__disposed) {
              return;
            }
            this.readyState = 4;
            this._emit("readystatechange");
            this._emit("error");
            this._emit("loadend");
          }, this));
        }

      }

      // BUGFIX: IE < 9
      // IE < 9 tends to cache overly agressive. This may result in stale
      // representations. Force validating freshness of cached representation.
      if (qx.core.Environment.get("engine.name") === "mshtml" &&
        qx.core.Environment.get("browser.documentmode") < 9 &&
        this.__nativeXhr.readyState > 0) {
          this.__nativeXhr.setRequestHeader("If-Modified-Since", "-1");
        }

      // BUGFIX: Firefox
      // Firefox < 4 fails to trigger onreadystatechange OPENED for sync requests
      if (qx.core.Environment.get("engine.name") === "gecko" &&
          parseInt(qx.core.Environment.get("engine.version"), 10) < 2 &&
          !this.__async) {
        // Native XHR is already set to readyState DONE. Fake readyState
        // and call onreadystatechange manually.
        this.readyState = qx.bom.request.Xhr.OPENED;
        this._emit("readystatechange");
      }

    },

    /**
     * Sets an HTTP request header to be used by the request.
     *
     * Note: The request must be initialized before using this method.
     *
     * @param key {String}
     *  The name of the header whose value is to be set.
     * @param value {String}
     *  The value to set as the body of the header.
     * @return {qx.bom.request.Xhr} Self for chaining.
     */
    setRequestHeader: function(key, value) {
      this.__checkDisposed();

      // Detect conditional requests
      if (key == "If-Match" || key == "If-Modified-Since" ||
        key == "If-None-Match" || key == "If-Range") {
        this.__conditional = true;
      }

      this.__nativeXhr.setRequestHeader(key, value);
      return this;
    },

    /**
     * Sends request.
     *
     * @param data {String|Document?null}
     *  Optional data to send.
     * @return {qx.bom.request.Xhr} Self for chaining.
     */
    send: function(data) {
      this.__checkDisposed();

      // BUGFIX: IE & Firefox < 3.5
      // For sync requests, some browsers throw error on open()
      // while it should be on send()
      //
      if (!this.__async && this.__openError) {
        throw this.__openError;
      }

      // BUGFIX: Opera
      // On network error, Opera stalls at readyState HEADERS_RECEIVED
      // This violates the spec. See here http://www.w3.org/TR/XMLHttpRequest2/#send
      // (Section: If there is a network error)
      //
      // To fix, assume a default timeout of 10 seconds. Note: The "error"
      // event will be fired correctly, because the error flag is inferred
      // from the statusText property. Of course, compared to other
      // browsers there is an additional call to ontimeout(), but this call
      // should not harm.
      //
      if (qx.core.Environment.get("engine.name") === "opera" &&
          this.timeout === 0) {
        this.timeout = 10000;
      }

      // Timeout
      if (this.timeout > 0) {
        this.__timerId = window.setTimeout(this.__onTimeoutBound, this.timeout);
      }

      // BUGFIX: Firefox 2
      // "NS_ERROR_XPC_NOT_ENOUGH_ARGS" when calling send() without arguments
      data = typeof data == "undefined" ? null : data;

      // Some browsers may throw an error when sending of async request fails.
      // This violates the spec which states only sync requests should.
      try {
        if (qx.core.Environment.get("qx.debug.io")) {
          qx.Bootstrap.debug(qx.bom.request.Xhr, "Send native request");
        }
        this.__nativeXhr.send(data);
      } catch(SendError) {
        if (!this.__async) {
          throw SendError;
        }

        // BUGFIX
        // Some browsers throws error when file not found via file:// protocol.
        // Synthesize readyState changes.
        if (this._getProtocol() === "file:") {
          this.readyState = 2;
          this.__readyStateChange();

          var that = this;
          window.setTimeout(function() {
            if (that.__disposed) {
              return;
            }
            that.readyState = 3;
            that.__readyStateChange();

            that.readyState = 4;
            that.__readyStateChange();
          });

        }

      }

      // BUGFIX: Firefox
      // Firefox fails to trigger onreadystatechange DONE for sync requests
      if (qx.core.Environment.get("engine.name") === "gecko" && !this.__async) {
        // Properties all set, only missing native readystatechange event
        this.__onNativeReadyStateChange();
      }

      // Set send flag
      this.__send = true;
      return this;
    },

    /**
     * Abort request - i.e. cancels any network activity.
     *
     * Note:
     *  On Windows 7 every browser strangely skips the loading phase
     *  when this method is called (because readyState never gets 3).
     *
     *  So keep this in mind if you rely on the phases which are
     *  passed through. They will be "opened", "sent", "abort"
     *  instead of normally "opened", "sent", "loading", "abort".
     *
     * @return {qx.bom.request.Xhr} Self for chaining.
     */
    abort: function() {
      this.__checkDisposed();

      this.__abort = true;
      this.__nativeXhr.abort();

      if (this.__nativeXhr) {
        this.readyState = this.__nativeXhr.readyState;
      }
      return this;
    },


    /**
     * Helper to emit events and call the callback methods.
     * @param event {String} The name of the event.
     */
    _emit: function(event) {
      if (this["on" + event]) {
        this["on" + event]();
      }
      this._emitter.emit(event, this);
    },

    /**
     * Event handler for XHR event that fires at every state change.
     *
     * Replace with custom method to get informed about the communication progress.
     */
    onreadystatechange: function() {},

    /**
     * Event handler for XHR event "load" that is fired on successful retrieval.
     *
     * Note: This handler is called even when the HTTP status indicates an error.
     *
     * Replace with custom method to listen to the "load" event.
     */
    onload: function() {},

    /**
     * Event handler for XHR event "loadend" that is fired on retrieval.
     *
     * Note: This handler is called even when a network error (or similar)
     * occurred.
     *
     * Replace with custom method to listen to the "loadend" event.
     */
    onloadend: function() {},

    /**
     * Event handler for XHR event "error" that is fired on a network error.
     *
     * Replace with custom method to listen to the "error" event.
     */
    onerror: function() {},

    /**
    * Event handler for XHR event "abort" that is fired when request
    * is aborted.
    *
    * Replace with custom method to listen to the "abort" event.
    */
    onabort: function() {},

    /**
    * Event handler for XHR event "timeout" that is fired when timeout
    * interval has passed.
    *
    * Replace with custom method to listen to the "timeout" event.
    */
    ontimeout: function() {},


    /**
     * Add an event listener for the given event name.
     *
     * @param name {String} The name of the event to listen to.
     * @param listener {Function} The function to execute when the event is fired
     * @param ctx {var?} The context of the listener.
     * @return {qx.bom.request.Xhr} Self for chaining.
     */
    on: function(name, listener, ctx) {
      this._emitter.on(name, listener, ctx);
      return this;
    },


    /**
     * Get a single response header from response.
     *
     * @param header {String}
     *  Key of the header to get the value from.
     * @return {String}
     *  Response header.
     */
    getResponseHeader: function(header) {
      this.__checkDisposed();

      return this.__nativeXhr.getResponseHeader(header);
    },

    /**
     * Get all response headers from response.
     *
     * @return {String} All response headers.
     */
    getAllResponseHeaders: function() {
      this.__checkDisposed();

      return this.__nativeXhr.getAllResponseHeaders();
    },

    /**
     * Overrides the MIME type returned by the server
     * and must be called before @send()@.
     *
     * Note:
     *
     * * IE doesn't support this method so in this case an Error is thrown.
     * * after calling this method @getResponseHeader("Content-Type")@
     *   may return the original (Firefox 23, IE 10, Safari 6) or
     *   the overriden content type (Chrome 28+, Opera 15+).
     *
     *
     * @param mimeType {String} The mimeType for overriding.
     * @return {qx.bom.request.Xhr} Self for chaining.
     */
    overrideMimeType: function(mimeType) {
      this.__checkDisposed();

      if (this.__nativeXhr.overrideMimeType) {
        this.__nativeXhr.overrideMimeType(mimeType);
      } else {
        throw new Error("Native XHR object doesn't support overrideMimeType.");
      }

      return this;
    },

    /**
     * Get wrapped native XMLHttpRequest (or equivalent).
     *
     * Can be XMLHttpRequest or ActiveX.
     *
     * @return {Object} XMLHttpRequest or equivalent.
     */
    getRequest: function() {
      return this.__nativeXhr;
    },

    /*
    ---------------------------------------------------------------------------
      HELPER
    ---------------------------------------------------------------------------
    */

    /**
     * Dispose object and wrapped native XHR.
     * @return {Boolean} <code>true</code> if the object was successfully disposed
     */
    dispose: function() {
      if (this.__disposed) {
        return false;
      }

      window.clearTimeout(this.__timerId);

      // Remove unload listener in IE. Aborting on unload is no longer required
      // for this instance.
      if (window.detachEvent) {
        window.detachEvent("onunload", this.__onUnloadBound);
      }

      // May fail in IE
      try {
        this.__nativeXhr.onreadystatechange;
      } catch(PropertiesNotAccessable) {
        return false;
      }

      // Clear out listeners
      var noop = function() {};
      this.__nativeXhr.onreadystatechange = noop;
      this.__nativeXhr.onload = noop;
      this.__nativeXhr.onerror = noop;

      // Abort any network activity
      this.abort();

      // Remove reference to native XHR
      this.__nativeXhr = null;

      this.__disposed = true;
      return true;
    },


    /**
     * Check if the request has already beed disposed.
     * @return {Boolean} <code>true</code>, if the request has been disposed.
     */
    isDisposed : function() {
      return !!this.__disposed;
    },


    /*
    ---------------------------------------------------------------------------
      PROTECTED
    ---------------------------------------------------------------------------
    */

    /**
     * Create XMLHttpRequest (or equivalent).
     *
     * @return {Object} XMLHttpRequest or equivalent.
     */
    _createNativeXhr: function() {
      var xhr = qx.core.Environment.get("io.xhr");

      if (xhr === "xhr") {
        return new XMLHttpRequest();
      }

      if (xhr == "activex") {
        return new window.ActiveXObject("Microsoft.XMLHTTP");
      }

      qx.Bootstrap.error(this, "No XHR support available.");
    },

    /**
     * Get protocol of requested URL.
     *
     * @return {String} The used protocol.
     */
    _getProtocol: function() {
      var url = this.__url;
      var protocolRe = /^(\w+:)\/\//;

      // Could be http:// from file://
      if (url !== null && url.match) {
        var match = url.match(protocolRe);
        if (match && match[1]) {
          return match[1];
        }
      }

      return window.location.protocol;
    },

    /*
    ---------------------------------------------------------------------------
      PRIVATE
    ---------------------------------------------------------------------------
    */

    /**
     * @type {Object} XMLHttpRequest or equivalent.
     */
    __nativeXhr: null,

    /**
     * @type {Boolean} Whether request is async.
     */
    __async: null,

    /**
     * @type {Function} Bound __onNativeReadyStateChange handler.
     */
    __onNativeReadyStateChangeBound: null,

    /**
     * @type {Function} Bound __onNativeAbort handler.
     */
    __onNativeAbortBound: null,

    /**
     * @type {Function} Bound __onUnload handler.
     */
    __onUnloadBound: null,

    /**
     * @type {Function} Bound __onTimeout handler.
     */
    __onTimeoutBound: null,

    /**
     * @type {Boolean} Send flag
     */
    __send: null,

    /**
     * @type {String} Requested URL
     */
    __url: null,

    /**
     * @type {Boolean} Abort flag
     */
    __abort: null,

    /**
     * @type {Boolean} Timeout flag
     */
    __timeout: null,

    /**
     * @type {Boolean} Whether object has been disposed.
     */
    __disposed: null,

    /**
     * @type {Number} ID of timeout timer.
     */
    __timerId: null,

    /**
     * @type {Error} Error thrown on open, if any.
     */
    __openError: null,

    /**
     * @type {Boolean} Conditional get flag
     */
     __conditional: null,

    /**
     * Init native XHR.
     */
    __initNativeXhr: function() {
      // Create native XHR or equivalent and hold reference
      this.__nativeXhr = this._createNativeXhr();

      // Track native ready state changes
      this.__nativeXhr.onreadystatechange = this.__onNativeReadyStateChangeBound;

      // Track native abort, when supported
      if (this.__nativeXhr.onabort) {
        this.__nativeXhr.onabort = this.__onNativeAbortBound;
      }

      // Reset flags
      this.__disposed = this.__send = this.__abort = false;
    },

    /**
     * Track native abort.
     *
     * In case the end user cancels the request by other
     * means than calling abort().
     */
    __onNativeAbort: function() {
      // When the abort that triggered this method was not a result from
      // calling abort()
      if (!this.__abort) {
        this.abort();
      }
    },

    /**
     * Handle native onreadystatechange.
     *
     * Calls user-defined function onreadystatechange on each
     * state change and syncs the XHR status properties.
     */
    __onNativeReadyStateChange: function() {
      var nxhr = this.__nativeXhr,
          propertiesReadable = true;

      if (qx.core.Environment.get("qx.debug.io")) {
        qx.Bootstrap.debug(qx.bom.request.Xhr, "Received native readyState: " + nxhr.readyState);
      }

      // BUGFIX: IE, Firefox
      // onreadystatechange() is called twice for readyState OPENED.
      //
      // Call onreadystatechange only when readyState has changed.
      if (this.readyState == nxhr.readyState) {
        return;
      }

      // Sync current readyState
      this.readyState = nxhr.readyState;

      // BUGFIX: IE
      // Superfluous onreadystatechange DONE when aborting OPENED
      // without send flag
      if (this.readyState === qx.bom.request.Xhr.DONE &&
          this.__abort && !this.__send) {
        return;
      }

      // BUGFIX: IE
      // IE fires onreadystatechange HEADERS_RECEIVED and LOADING when sync
      //
      // According to spec, only onreadystatechange OPENED and DONE should
      // be fired.
      if (!this.__async && (nxhr.readyState == 2 || nxhr.readyState == 3)) {
        return;
      }

      // Default values according to spec.
      this.status = 0;
      this.statusText = this.responseText = "";
      this.responseXML = null;

      if (this.readyState >= qx.bom.request.Xhr.HEADERS_RECEIVED) {
        // In some browsers, XHR properties are not readable
        // while request is in progress.
        try {
          this.status = nxhr.status;
          this.statusText = nxhr.statusText;
          this.responseText = nxhr.responseText;
          this.responseXML = nxhr.responseXML;
        } catch(XhrPropertiesNotReadable) {
          propertiesReadable = false;
        }

        if (propertiesReadable) {
          this.__normalizeStatus();
          this.__normalizeResponseXML();
        }
      }

      this.__readyStateChange();

      // BUGFIX: IE
      // Memory leak in XMLHttpRequest (on-page)
      if (this.readyState == qx.bom.request.Xhr.DONE) {
        // Allow garbage collecting of native XHR
        if (nxhr) {
          nxhr.onreadystatechange = function() {};
        }
      }

    },

    /**
     * Handle readystatechange. Called internally when readyState is changed.
     */
    __readyStateChange: function() {
      var that = this;

      // Cancel timeout before invoking handlers because they may throw
      if (this.readyState === qx.bom.request.Xhr.DONE) {
        // Request determined DONE. Cancel timeout.
        window.clearTimeout(this.__timerId);
      }

      // BUGFIX: IE
      // IE < 8 fires LOADING and DONE on open() - before send() - when from cache
      if (qx.core.Environment.get("engine.name") == "mshtml" &&
          qx.core.Environment.get("browser.documentmode") < 8) {

        // Detect premature events when async. LOADING and DONE is
        // illogical to happen before request was sent.
        if (this.__async && !this.__send && this.readyState >= qx.bom.request.Xhr.LOADING) {

          if (this.readyState == qx.bom.request.Xhr.LOADING) {
            // To early to fire, skip.
            return;
          }

          if (this.readyState == qx.bom.request.Xhr.DONE) {
            window.setTimeout(function() {
              if (that.__disposed) {
                return;
              }
              // Replay previously skipped
              that.readyState = 3;
              that._emit("readystatechange");

              that.readyState = 4;
              that._emit("readystatechange");
              that.__readyStateChangeDone();
            });
            return;
          }

        }
      }

      // Always fire "readystatechange"
      this._emit("readystatechange");
      if (this.readyState === qx.bom.request.Xhr.DONE) {
        this.__readyStateChangeDone();
      }
    },

    /**
     * Handle readystatechange. Called internally by
     * {@link #__readyStateChange} when readyState is DONE.
     */
    __readyStateChangeDone: function() {
      // Fire "timeout" if timeout flag is set
      if (this.__timeout) {
        this._emit("timeout");

        // BUGFIX: Opera
        // Since Opera does not fire "error" on network error, fire additional
        // "error" on timeout (may well be related to network error)
        if (qx.core.Environment.get("engine.name") === "opera") {
          this._emit("error");
        }

        this.__timeout = false;

      // Fire either "abort", "load" or "error"
      } else {
        if (this.__abort) {
          this._emit("abort");
        } else{
          if (this.__isNetworkError()) {
            this._emit("error");
          } else {
            this._emit("load");
          }
        }
      }

      // Always fire "onloadend" when DONE
      this._emit("loadend");
    },

    /**
     * Check for network error.
     *
     * @return {Boolean} Whether a network error occured.
     */
    __isNetworkError: function() {
      var error;

      // Infer the XHR internal error flag from statusText when not aborted.
      // See http://www.w3.org/TR/XMLHttpRequest2/#error-flag and
      // http://www.w3.org/TR/XMLHttpRequest2/#the-statustext-attribute
      //
      // With file://, statusText is always falsy. Assume network error when
      // response is empty.
      if (this._getProtocol() === "file:") {
        error = !this.responseText;
      } else {
        error = !this.statusText;
      }

      return error;
    },

    /**
     * Handle faked timeout.
     */
    __onTimeout: function() {
      // Basically, mimick http://www.w3.org/TR/XMLHttpRequest2/#timeout-error
      var nxhr = this.__nativeXhr;
      this.readyState = qx.bom.request.Xhr.DONE;

      // Set timeout flag
      this.__timeout = true;

      // No longer consider request. Abort.
      nxhr.abort();
      this.responseText = "";
      this.responseXML = null;

      // Signal readystatechange
      this.__readyStateChange();
    },

    /**
     * Normalize status property across browsers.
     */
    __normalizeStatus: function() {
      var isDone = this.readyState === qx.bom.request.Xhr.DONE;

      // BUGFIX: Most browsers
      // Most browsers tell status 0 when it should be 200 for local files
      if (this._getProtocol() === "file:" && this.status === 0 && isDone) {
        if (!this.__isNetworkError()) {
          this.status = 200;
        }
      }

      // BUGFIX: IE
      // IE sometimes tells 1223 when it should be 204
      if (this.status === 1223) {
        this.status = 204;
      }

      // BUGFIX: Opera
      // Opera tells 0 for conditional requests when it should be 304
      //
      // Detect response to conditional request that signals fresh cache.
      if (qx.core.Environment.get("engine.name") === "opera") {
        if (
          isDone &&                 // Done
          this.__conditional &&     // Conditional request
          !this.__abort &&          // Not aborted
          this.status === 0         // But status 0!
        ) {
          this.status = 304;
        }
      }
    },

    /**
     * Normalize responseXML property across browsers.
     */
    __normalizeResponseXML: function() {
      // BUGFIX: IE
      // IE does not recognize +xml extension, resulting in empty responseXML.
      //
      // Check if Content-Type is +xml, verify missing responseXML then parse
      // responseText as XML.
      if (qx.core.Environment.get("engine.name") == "mshtml" &&
          (this.getResponseHeader("Content-Type") || "").match(/[^\/]+\/[^\+]+\+xml/) &&
           this.responseXML && !this.responseXML.documentElement) {
        var dom = new window.ActiveXObject("Microsoft.XMLDOM");
        dom.async = false;
        dom.validateOnParse = false;
        dom.loadXML(this.responseText);
        this.responseXML = dom;
      }
    },

    /**
     * Handler for native unload event.
     */
    __onUnload: function() {
      try {
        // Abort and dispose
        if (this) {
          this.dispose();
        }
      } catch(e) {}
    },

    /**
     * Helper method to determine whether browser supports reusing the
     * same native XHR to send more requests.
     * @return {Boolean} <code>true</code> if request object reuse is supported
     */
    __supportsManyRequests: function() {
      var name = qx.core.Environment.get("engine.name");
      var version = qx.core.Environment.get("browser.version");

      return !(name == "mshtml" && version < 9 ||
               name == "gecko" && version < 3.5);
    },

    /**
     * Throw when already disposed.
     */
    __checkDisposed: function() {
      if (this.__disposed) {
        throw new Error("Already disposed");
      }
    }
  },

  defer: function() {
    qx.core.Environment.add("qx.debug.io", false);
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2013 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Richard Sternagel (rsternagel)

************************************************************************ */

/**
 * Parsers for parsing response strings (especially for XHR).
 *
 * Known parsers are: <code>"json"</code> and <code>"xml"</code>.
 *
 * @require(qx.util.ResponseParser#parse)
 */
qx.Bootstrap.define("qx.util.ResponseParser",
{

  /**
   * @param parser {String|Function} See {@link #setParser}.
   */
  construct: function(parser) {
    if (parser !== undefined) {
      this.setParser(parser);
    }
  },

  statics:
  {
    /**
     * @type {Map} Map of parser functions. Parsers defined here can be
     * referenced symbolically, e.g. with {@link #setParser}.
     *
     * Known parsers are: <code>"json"</code> and <code>"xml"</code>.
     */
    PARSER: {
      json: qx.lang.Json.parse,
      xml: qx.xml.Document.fromString
    }
  },

  members :
  {
    __parser: null,

    /**
     * Returns given response parsed with parser
     * determined by {@link #_getParser}.
     *
     * @param response {String} response (e.g JSON/XML string)
     * @param contentType {String} contentType (e.g. 'application/json')
     * @return {String|Object} The parsed response of the request.
     */
    parse: function(response, contentType) {
      var parser = this._getParser(contentType);

      if (typeof parser === "function") {
        if (response !== "") {
          return parser.call(this, response);
        }
      }

      return response;
    },


    /**
     * Set parser used to parse response once request has
     * completed successfully.
     *
     * Usually, the parser is correctly inferred from the
     * content type of the response. This method allows to force the
     * parser being used, e.g. if the content type returned from
     * the backend is wrong or the response needs special parsing.
     *
     * Parser most typically used can be referenced symbolically.
     * To cover edge cases, a function can be given. When parsing
     * the response, this function is called with the raw response as
     * first argument.
     *
     * @param parser {String|Function}
     *
     * Can be:
     *
     * <ul>
     *   <li>A parser defined in {@link qx.util.ResponseParser#PARSER},
     *       referenced by string.</li>
     *   <li>The function to invoke.
     *       Receives the raw response as argument.</li>
     * </ul>
     *
     * @return {Function} The parser function
     */
    setParser: function(parser) {
      // Symbolically given known parser
      if (typeof qx.util.ResponseParser.PARSER[parser] === "function") {
        return this.__parser = qx.util.ResponseParser.PARSER[parser];
      }

      // If parser is not a symbol, it must be a function
      if (qx.core.Environment.get("qx.debug")) {
        qx.core.Assert.assertFunction(parser);
      }

      return this.__parser = parser;
    },


    /**
     * Gets the parser.
     *
     * If not defined explicitly using {@link #setParser},
     * the parser is inferred from the content type.
     *
     * Override this method to extend the list of content types
     * being handled.
     *
     * @param contentType {String}
     * @return {Function|null} The parser function or <code>null</code> if the
     * content type is undetermined.
     *
     */
    _getParser: function(contentType) {
      var parser = this.__parser,
          contentTypeOrig = "",
          contentTypeNormalized = "";

      // Use user-provided parser, if any
      if (parser) {
        return parser;
      }

      // See http://restpatterns.org/Glossary/MIME_Type

      contentTypeOrig = contentType || "";

      // Ignore parameters (e.g. the character set)
      contentTypeNormalized = contentTypeOrig.replace(/;.*$/, "");

      if ((/^application\/(\w|\.)*\+?json$/).test(contentTypeNormalized)) {
        parser = qx.util.ResponseParser.PARSER.json;
      }

      if ((/^application\/xml$/).test(contentTypeNormalized)) {
        parser = qx.util.ResponseParser.PARSER.xml;
      }

      // Deprecated
      if ((/[^\/]+\/[^\+]+\+xml$/).test(contentTypeOrig)) {
        parser = qx.util.ResponseParser.PARSER.xml;
      }

      return parser;
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * The form object is responsible for managing form items. For that, it takes
 * advantage of two existing qooxdoo classes.
 * The {@link qx.ui.form.Resetter} is used for resetting and the
 * {@link qx.ui.form.validation.Manager} is used for all validation purposes.
 *
 * The view code can be found in the used renderer ({@link qx.ui.form.renderer}).
 */
qx.Class.define("qx.ui.form.Form",
{
  extend : qx.core.Object,


  construct : function()
  {
    this.base(arguments);

    this.__groups = [];
    this._buttons = [];
    this._buttonOptions = [];
    this._validationManager = new qx.ui.form.validation.Manager();
    this._resetter = this._createResetter();
  },


  members :
  {
    __groups : null,
    _validationManager : null,
    _groupCounter : 0,
    _buttons : null,
    _buttonOptions : null,
    _resetter : null,

    /*
    ---------------------------------------------------------------------------
       ADD
    ---------------------------------------------------------------------------
    */

    /**
     * Adds a form item to the form including its internal
     * {@link qx.ui.form.validation.Manager} and {@link qx.ui.form.Resetter}.
     *
     * *Hint:* The order of all add calls represent the order in the layout.
     *
     * @param item {qx.ui.form.IForm} A supported form item.
     * @param label {String} The string, which should be used as label.
     * @param validator {Function | qx.ui.form.validation.AsyncValidator ? null}
     *   The validator which is used by the validation
     *   {@link qx.ui.form.validation.Manager}.
     * @param name {String?null} The name which is used by the data binding
     *   controller {@link qx.data.controller.Form}.
     * @param validatorContext {var?null} The context of the validator.
     * @param options {Map?null} An additional map containin custom data which
     *   will be available in your form renderer specific to the added item.
     */
    add : function(item, label, validator, name, validatorContext, options) {
      if (this.__isFirstAdd()) {
        this.__groups.push({
          title: null, items: [], labels: [], names: [],
          options: [], headerOptions: {}
        });
      }
      // save the given arguments
      this.__groups[this._groupCounter].items.push(item);
      this.__groups[this._groupCounter].labels.push(label);
      this.__groups[this._groupCounter].options.push(options);
      // if no name is given, use the label without not working character
      if (name == null) {
        name = label.replace(
          /\s+|&|-|\+|\*|\/|\||!|\.|,|:|\?|;|~|%|\{|\}|\(|\)|\[|\]|<|>|=|\^|@|\\/g, ""
        );
      }
      this.__groups[this._groupCounter].names.push(name);

      // add the item to the validation manager
      this._validationManager.add(item, validator, validatorContext);
      // add the item to the reset manager
      this._resetter.add(item);
    },


    /**
     * Adds a group header to the form.
     *
     * *Hint:* The order of all add calls represent the order in the layout.
     *
     * @param title {String} The title of the group header.
     * @param options {Map?null} A special set of custom data which will be
     *   given to the renderer.
     */
    addGroupHeader : function(title, options) {
      if (!this.__isFirstAdd()) {
        this._groupCounter++;
      }
      this.__groups.push({
        title: title, items: [], labels: [], names: [],
        options: [], headerOptions: options
      });
    },


    /**
     * Adds a button to the form.
     *
     * *Hint:* The order of all add calls represent the order in the layout.
     *
     * @param button {qx.ui.form.Button} The button to add.
     * @param options {Map?null} An additional map containin custom data which
     *   will be available in your form renderer specific to the added button.
     */
    addButton : function(button, options) {
      this._buttons.push(button);
      this._buttonOptions.push(options || null);
    },


    /**
     * Returns whether something has already been added.
     *
     * @return {Boolean} true, if nothing has been added jet.
     */
    __isFirstAdd : function() {
      return this.__groups.length === 0;
    },


    /*
    ---------------------------------------------------------------------------
       RESET SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Resets the form. This means reseting all form items and the validation.
     */
    reset : function() {
      this._resetter.reset();
      this._validationManager.reset();
    },


    /**
     * Redefines the values used for resetting. It calls
     * {@link qx.ui.form.Resetter#redefine} to get that.
     */
    redefineResetter : function() {
      this._resetter.redefine();
    },


    /**
     * Redefines the value used for resetting of the given item. It calls
     * {@link qx.ui.form.Resetter#redefineItem} to get that.
     *
     * @param item {qx.ui.core.Widget} The item to redefine.
     */
    redefineResetterItem : function(item) {
      this._resetter.redefineItem(item);
    },



    /*
    ---------------------------------------------------------------------------
       VALIDATION
    ---------------------------------------------------------------------------
    */

    /**
     * Validates the form using the
     * {@link qx.ui.form.validation.Manager#validate} method.
     *
     * @return {Boolean | null} The validation result.
     */
    validate : function() {
      return this._validationManager.validate();
    },


    /**
     * Returns the internally used validation manager. If you want to do some
     * enhanced validation tasks, you need to use the validation manager.
     *
     * @return {qx.ui.form.validation.Manager} The used manager.
     */
    getValidationManager : function() {
      return this._validationManager;
    },


    /*
    ---------------------------------------------------------------------------
       RENDERER SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Accessor method for the renderer which returns all added items in a
     * array containing a map of all items:
     * {title: title, items: [], labels: [], names: []}
     *
     * @return {Array} An array containing all necessary data for the renderer.
     * @internal
     */
    getGroups : function() {
      return this.__groups;
    },


    /**
     * Accessor method for the renderer which returns all added buttons in an
     * array.
     * @return {Array} An array containing all added buttons.
     * @internal
     */
    getButtons : function() {
      return this._buttons;
    },


    /**
     * Accessor method for the renderer which returns all added options for
     * the buttons in an array.
     * @return {Array} An array containing all added options for the buttons.
     * @internal
     */
    getButtonOptions : function() {
      return this._buttonOptions;
    },



    /*
    ---------------------------------------------------------------------------
       INTERNAL
    ---------------------------------------------------------------------------
    */

    /**
     * Returns all added items as a map.
     *
     * @return {Map} A map containing for every item an entry with its name.
     *
     * @internal
     */
    getItems : function() {
      var items = {};
      // go threw all groups
      for (var i = 0; i < this.__groups.length; i++) {
        var group = this.__groups[i];
        // get all items
        for (var j = 0; j < group.names.length; j++) {
          var name = group.names[j];
          items[name] = group.items[j];
        }
      }
      return items;
    },


    /**
     * Creates and returns the used resetter class.
     *
     * @return {qx.ui.form.Resetter} the resetter class.
     *
     * @internal
     */
    _createResetter : function() {
      return new qx.ui.form.Resetter();
    }
  },


  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */
  destruct : function()
  {
    // holding references to widgets --> must set to null
    this.__groups = this._buttons = this._buttonOptions = null;
    this._validationManager.dispose();
    this._resetter.dispose();
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * This validation manager is responsible for validation of forms.
 */
qx.Class.define("qx.ui.form.validation.Manager",
{
  extend : qx.core.Object,

  construct : function()
  {
    this.base(arguments);

    // storage for all form items
    this.__formItems = [];
    // storage for all results of async validation calls
    this.__asyncResults = {};
    // set the default required field message
    this.setRequiredFieldMessage(qx.locale.Manager.tr("This field is required"));
  },


  events :
  {
    /**
     * Change event for the valid state.
     */
    "changeValid" : "qx.event.type.Data",

    /**
     * Signals that the validation is done. This is not needed on synchronous
     * validation (validation is done right after the call) but very important
     * in the case an asynchronous validator will be used.
     */
    "complete" : "qx.event.type.Event"
  },


  properties :
  {
    /**
     * The validator of the form itself. You can set a function (for
     * synchronous validation) or a {@link qx.ui.form.validation.AsyncValidator}.
     * In both cases, the function can have all added form items as first
     * argument and the manager as a second argument. The manager should be used
     * to set the {@link #invalidMessage}.
     *
     * Keep in mind that the validator is optional if you don't need the
     * validation in the context of the whole form.
     * @type {Function | AsyncValidator}
     */
    validator :
    {
      check : "value instanceof Function || qx.Class.isSubClassOf(value.constructor, qx.ui.form.validation.AsyncValidator)",
      init : null,
      nullable : true
    },

    /**
     * The invalid message should store the message why the form validation
     * failed. It will be added to the array returned by
     * {@link #getInvalidMessages}.
     */
    invalidMessage :
    {
      check : "String",
      init: ""
    },


    /**
     * This message will be shown if a required field is empty and no individual
     * {@link qx.ui.form.MForm#requiredInvalidMessage} is given.
     */
    requiredFieldMessage :
    {
      check : "String",
      init : ""
    },


    /**
     * The context for the form validation.
     */
    context :
    {
      nullable : true
    }
  },


  members :
  {
    __formItems : null,
    __valid : null,
    __asyncResults : null,
    __syncValid : null,


    /**
     * Add a form item to the validation manager.
     *
     * The form item has to implement at least two interfaces:
     * <ol>
     *   <li>The {@link qx.ui.form.IForm} Interface</li>
     *   <li>One of the following interfaces:
     *     <ul>
     *       <li>{@link qx.ui.form.IBooleanForm}</li>
     *       <li>{@link qx.ui.form.IColorForm}</li>
     *       <li>{@link qx.ui.form.IDateForm}</li>
     *       <li>{@link qx.ui.form.INumberForm}</li>
     *       <li>{@link qx.ui.form.IStringForm}</li>
     *     </ul>
     *   </li>
     * </ol>
     * The validator can be a synchronous or asynchronous validator. In
     * both cases the validator can either returns a boolean or fire an
     * {@link qx.core.ValidationError}. For synchronous validation, a plain
     * JavaScript function should be used. For all asynchronous validations,
     * a {@link qx.ui.form.validation.AsyncValidator} is needed to wrap the
     * plain function.
     *
     * @param formItem {qx.ui.core.Widget} The form item to add.
     * @param validator {Function | qx.ui.form.validation.AsyncValidator}
     *   The validator.
     * @param context {var?null} The context of the validator.
     */
    add: function(formItem, validator, context) {
      // check for the form API
      if (!this.__supportsInvalid(formItem)) {
        throw new Error("Added widget not supported.");
      }
      // check for the data type
      if (this.__supportsSingleSelection(formItem) && !formItem.getValue) {
        // check for a validator
        if (validator != null) {
          throw new Error("Widgets supporting selection can only be validated " +
          "in the form validator");
        }
      }
      var dataEntry =
      {
        item : formItem,
        validator : validator,
        valid : null,
        context : context
      };
      this.__formItems.push(dataEntry);
    },


    /**
     * Remove a form item from the validation manager.
     *
     * @param formItem {qx.ui.core.Widget} The form item to remove.
     * @return {qx.ui.core.Widget?null} The removed form item or
     *  <code>null</code> if the item could not be found.
     */
    remove : function(formItem)
    {
      var items = this.__formItems;

      for (var i = 0, len = items.length; i < len; i++)
      {
        if (formItem === items[i].item)
        {
          items.splice(i, 1);
          return formItem;
        }
      }

      return null;
    },


    /**
     * Returns registered form items from the validation manager.
     *
     * @return {Array} The form items which will be validated.
     */
    getItems : function()
    {
      var items = [];
      for (var i=0; i < this.__formItems.length; i++) {
        items.push(this.__formItems[i].item);
      };
      return items;
    },


    /**
     * Invokes the validation. If only synchronous validators are set, the
     * result of the whole validation is available at the end of the method
     * and can be returned. If an asynchronous validator is set, the result
     * is still unknown at the end of this method so nothing will be returned.
     * In both cases, a {@link #complete} event will be fired if the validation
     * has ended. The result of the validation can then be accessed with the
     * {@link #getValid} method.
     *
     * @return {Boolean|undefined} The validation result, if available.
     */
    validate : function() {
      var valid = true;
      this.__syncValid = true; // collaboration of all synchronous validations
      var items = [];

      // check all validators for the added form items
      for (var i = 0; i < this.__formItems.length; i++) {
        var formItem = this.__formItems[i].item;
        var validator = this.__formItems[i].validator;

        // store the items in case of form validation
        items.push(formItem);

        // ignore all form items without a validator
        if (validator == null) {
          // check for the required property
          var validatorResult = this.__validateRequired(formItem);
          valid = valid && validatorResult;
          this.__syncValid = validatorResult && this.__syncValid;
          continue;
        }

        var validatorResult = this.__validateItem(
          this.__formItems[i], formItem.getValue()
        );
        // keep that order to ensure that null is returned on async cases
        valid = validatorResult && valid;
        if (validatorResult != null) {
          this.__syncValid = validatorResult && this.__syncValid;
        }
      }

      // check the form validator (be sure to invoke it even if the form
      // items are already false, so keep the order!)
      var formValid = this.__validateForm(items);
      if (qx.lang.Type.isBoolean(formValid)) {
        this.__syncValid = formValid && this.__syncValid;
      }
      valid = formValid && valid;

      this.__setValid(valid);

      if (qx.lang.Object.isEmpty(this.__asyncResults)) {
        this.fireEvent("complete");
      }
      return valid;
    },


    /**
     * Checks if the form item is required. If so, the value is checked
     * and the result will be returned. If the form item is not required, true
     * will be returned.
     *
     * @param formItem {qx.ui.core.Widget} The form item to check.
     * @return {var} Validation result
     */
    __validateRequired : function(formItem) {
      if (formItem.getRequired()) {
        // if its a widget supporting the selection
        if (this.__supportsSingleSelection(formItem)) {
          var validatorResult = !!formItem.getSelection()[0];
        // otherwise, a value should be supplied
        } else {
          var value = formItem.getValue();
          var validatorResult = !!value || value === 0;
        }
        formItem.setValid(validatorResult);
        var individualMessage = formItem.getRequiredInvalidMessage();
        var message = individualMessage ? individualMessage : this.getRequiredFieldMessage();
        formItem.setInvalidMessage(message);
        return validatorResult;
      }
      return true;
    },


    /**
     * Validates a form item. This method handles the differences of
     * synchronous and asynchronous validation and returns the result of the
     * validation if possible (synchronous cases). If the validation is
     * asynchronous, null will be returned.
     *
     * @param dataEntry {Object} The map stored in {@link #add}
     * @param value {var} The currently set value
     * @return {Boolean|null} Validation result or <code>null</code> for async
     * validation
     */
    __validateItem : function(dataEntry, value) {
      var formItem = dataEntry.item;
      var context = dataEntry.context;
      var validator = dataEntry.validator;

      // check for asynchronous validation
      if (this.__isAsyncValidator(validator)) {
        // used to check if all async validations are done
        this.__asyncResults[formItem.toHashCode()] = null;
        validator.validate(formItem, formItem.getValue(), this, context);
        return null;
      }

      var validatorResult = null;

      try {
        var validatorResult = validator.call(context || this, value, formItem);
        if (validatorResult === undefined) {
          validatorResult = true;
        }

      } catch (e) {
        if (e instanceof qx.core.ValidationError) {
          validatorResult = false;
          if (e.message && e.message != qx.type.BaseError.DEFAULTMESSAGE) {
            var invalidMessage = e.message;
          } else {
            var invalidMessage = e.getComment();
          }
          formItem.setInvalidMessage(invalidMessage);
        } else {
          throw e;
        }
      }

      formItem.setValid(validatorResult);
      dataEntry.valid = validatorResult;

      return validatorResult;
    },


    /**
     * Validates the form. It checks for asynchronous validation and handles
     * the differences to synchronous validation. If no form validator is given,
     * true will be returned. If a synchronous validator is given, the
     * validation result will be returned. In asynchronous cases, null will be
     * returned cause the result is not available.
     *
     * @param items {qx.ui.core.Widget[]} An array of all form items.
     * @return {Boolean|null} description
     */
    __validateForm: function(items) {
      var formValidator = this.getValidator();
      var context = this.getContext() || this;

      if (formValidator == null) {
        return true;
      }

      // reset the invalidMessage
      this.setInvalidMessage("");

      if (this.__isAsyncValidator(formValidator)) {
        this.__asyncResults[this.toHashCode()] = null;
        formValidator.validateForm(items, this, context);
        return null;
      }

      try {
        var formValid = formValidator.call(context, items, this);
        if (formValid === undefined) {
          formValid = true;
        }
      } catch (e) {
        if (e instanceof qx.core.ValidationError) {
          formValid = false;

          if (e.message && e.message != qx.type.BaseError.DEFAULTMESSAGE) {
            var invalidMessage = e.message;
          } else {
            var invalidMessage = e.getComment();
          }
          this.setInvalidMessage(invalidMessage);
        } else {
          throw e;
        }
      }
      return formValid;
    },


    /**
     * Helper function which checks, if the given validator is synchronous
     * or asynchronous.
     *
     * @param validator {Function|qx.ui.form.validation.AsyncValidator}
     *   The validator to check.
     * @return {Boolean} True, if the given validator is asynchronous.
     */
    __isAsyncValidator : function(validator) {
      var async = false;
      if (!qx.lang.Type.isFunction(validator)) {
        async = qx.Class.isSubClassOf(
          validator.constructor, qx.ui.form.validation.AsyncValidator
        );
      }
      return async;
    },


    /**
     * Returns true, if the given item implements the {@link qx.ui.form.IForm}
     * interface.
     *
     * @param formItem {qx.core.Object} The item to check.
     * @return {Boolean} true, if the given item implements the
     *   necessary interface.
     */
    __supportsInvalid : function(formItem) {
      var clazz = formItem.constructor;
      return qx.Class.hasInterface(clazz, qx.ui.form.IForm);
    },


    /**
     * Returns true, if the given item implements the
     * {@link qx.ui.core.ISingleSelection} interface.
     *
     * @param formItem {qx.core.Object} The item to check.
     * @return {Boolean} true, if the given item implements the
     *   necessary interface.
     */
    __supportsSingleSelection : function(formItem) {
      var clazz = formItem.constructor;
      return qx.Class.hasInterface(clazz, qx.ui.core.ISingleSelection);
    },


    /**
     * Internal setter for the valid member. It generates the event if
     * necessary and stores the new value
     *
     * @param value {Boolean|null} The new valid value of the manager.
     */
    __setValid: function(value) {
      var oldValue = this.__valid;
      this.__valid = value;
      // check for the change event
      if (oldValue != value) {
        this.fireDataEvent("changeValid", value, oldValue);
      }
    },


    /**
     * Returns the valid state of the manager.
     *
     * @return {Boolean|null} The valid state of the manager.
     */
    getValid: function() {
      return this.__valid;
    },


    /**
     * Returns the valid state of the manager.
     *
     * @return {Boolean|null} The valid state of the manager.
     */
    isValid: function() {
      return this.getValid();
    },


    /**
     * Returns an array of all invalid messages of the invalid form items and
     * the form manager itself.
     *
     * @return {String[]} All invalid messages.
     */
    getInvalidMessages: function() {
      var messages = [];
      // combine the messages of all form items
      for (var i = 0; i < this.__formItems.length; i++) {
        var formItem = this.__formItems[i].item;
        if (!formItem.getValid()) {
          messages.push(formItem.getInvalidMessage());
        }
      }
      // add the forms fail message
      if (this.getInvalidMessage() != "") {
        messages.push(this.getInvalidMessage());
      }

      return messages;
    },


    /**
     * Selects invalid form items
     *
     * @return {Array} invalid form items
     */
    getInvalidFormItems : function() {
      var res = [];
      for (var i = 0; i < this.__formItems.length; i++) {
        var formItem = this.__formItems[i].item;
        if (!formItem.getValid()) {
          res.push(formItem);
        }
      }

      return res;
    },


    /**
     * Resets the validator.
     */
    reset: function() {
      // reset all form items
      for (var i = 0; i < this.__formItems.length; i++) {
        var dataEntry = this.__formItems[i];
        // set the field to valid
        dataEntry.item.setValid(true);
      }
      // set the manager to its initial valid value
      this.__valid = null;
    },


    /**
     * Internal helper method to set the given item to valid for asynchronous
     * validation calls. This indirection is used to determinate if the
     * validation process is completed or if other asynchronous validators
     * are still validating. {@link #__checkValidationComplete} checks if the
     * validation is complete and will be called at the end of this method.
     *
     * @param formItem {qx.ui.core.Widget} The form item to set the valid state.
     * @param valid {Boolean} The valid state for the form item.
     *
     * @internal
     */
    setItemValid: function(formItem, valid) {
      // store the result
      this.__asyncResults[formItem.toHashCode()] = valid;
      formItem.setValid(valid);
      this.__checkValidationComplete();
    },


    /**
     * Internal helper method to set the form manager to valid for asynchronous
     * validation calls. This indirection is used to determinate if the
     * validation process is completed or if other asynchronous validators
     * are still validating. {@link #__checkValidationComplete} checks if the
     * validation is complete and will be called at the end of this method.
     *
     * @param valid {Boolean} The valid state for the form manager.
     *
     * @internal
     */
    setFormValid : function(valid) {
      this.__asyncResults[this.toHashCode()] = valid;
      this.__checkValidationComplete();
    },


    /**
     * Checks if all asynchronous validators have validated so the result
     * is final and the {@link #complete} event can be fired. If that's not
     * the case, nothing will happen in the method.
     */
    __checkValidationComplete : function() {
      var valid = this.__syncValid;

      // check if all async validators are done
      for (var hash in this.__asyncResults) {
        var currentResult = this.__asyncResults[hash];
        valid = currentResult && valid;
        // the validation is not done so just do nothing
        if (currentResult == null) {
          return;
        }
      }
      // set the actual valid state of the manager
      this.__setValid(valid);
      // reset the results
      this.__asyncResults = {};
      // fire the complete event (no entry in the results with null)
      this.fireEvent("complete");
    }
  },


  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */
  destruct : function()
  {
    this.__formItems = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * This class is responsible for validation in all asynchronous cases and
 * should always be used with {@link qx.ui.form.validation.Manager}.
 *
 *
 * It acts like a wrapper for asynchronous validation functions. These
 * validation function must be set in the constructor. The form manager will
 * invoke the validation and the validator function will be called with two
 * arguments:
 * <ul>
 *  <li>asyncValidator: A reference to the corresponding validator.</li>
 *  <li>value: The value of the assigned input field.</li>
 * </ul>
 * These two parameters are needed to set the validation status of the current
 * validator. {@link #setValid} is responsible for doing that.
 *
 *
 * *Warning:* Instances of this class can only be used with one input
 * field at a time. Multi usage is not supported!
 *
 * *Warning:* Calling {@link #setValid} synchronously does not work. If you
 * have an synchronous validator, please check
 * {@link qx.ui.form.validation.Manager#add}. If you have both cases, you have
 * to wrap the synchronous call in a timeout to make it asychronous.
 */
qx.Class.define("qx.ui.form.validation.AsyncValidator",
{
  extend : qx.core.Object,

  /**
   * @param validator {Function} The validator function, which has to be
   *   asynchronous.
   */
  construct : function(validator)
  {
    this.base(arguments);
    // save the validator function
    this.__validatorFunction = validator;
  },

  members :
  {
    __validatorFunction : null,
    __item : null,
    __manager : null,
    __usedForForm : null,

    /**
     * The validate function should only be called by
     * {@link qx.ui.form.validation.Manager}.
     *
     * It stores the given information and calls the validation function set in
     * the constructor. The method is used for form fields only. Validating a
     * form itself will be invokes with {@link #validateForm}.
     *
     * @param item {qx.ui.core.Widget} The form item which should be validated.
     * @param value {var} The value of the form item.
     * @param manager {qx.ui.form.validation.Manager} A reference to the form
     *   manager.
     * @param context {var?null} The context of the validator.
     *
     * @internal
     */
    validate: function(item, value, manager, context) {
      // mark as item validator
      this.__usedForForm = false;
      // store the item and the manager
      this.__item = item;
      this.__manager = manager;
      // invoke the user set validator function
      this.__validatorFunction.call(context || this, this, value);
    },


    /**
     * The validateForm function should only be called by
     * {@link qx.ui.form.validation.Manager}.
     *
     * It stores the given information and calls the validation function set in
     * the constructor. The method is used for forms only. Validating a
     * form item will be invokes with {@link #validate}.
     *
     * @param items {qx.ui.core.Widget[]} All form items of the form manager.
     * @param manager {qx.ui.form.validation.Manager} A reference to the form
     *   manager.
     * @param context {var?null} The context of the validator.
     *
     * @internal
     */
    validateForm : function(items, manager, context) {
      this.__usedForForm = true;
      this.__manager = manager;
      this.__validatorFunction.call(context, items, this);
    },


    /**
     * This method should be called within the asynchronous callback to tell the
     * validator the result of the validation.
     *
     * @param valid {Boolean} The boolean state of the validation.
     * @param message {String?} The invalidMessage of the validation.
     */
    setValid: function(valid, message) {
      // valid processing
      if (this.__usedForForm) {
        // message processing
        if (message !== undefined) {
          this.__manager.setInvalidMessage(message);
        }
        this.__manager.setFormValid(valid);
      } else {
        // message processing
        if (message !== undefined) {
          this.__item.setInvalidMessage(message);
        }
        this.__manager.setItemValid(this.__item, valid);
      }
    }
  },


  /*
   *****************************************************************************
      DESTRUCT
   *****************************************************************************
   */

  destruct : function() {
    this.__manager = this.__item = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Hagendorn (chris_schmidt)
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Each object, which should support single selection have to
 * implement this interface.
 */
qx.Interface.define("qx.ui.core.ISingleSelection",
{
  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */


  events :
  {
    /** Fires after the selection was modified */
    "changeSelection" : "qx.event.type.Data"
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */


  members :
  {
    /**
     * Returns an array of currently selected items.
     *
     * Note: The result is only a set of selected items, so the order can
     * differ from the sequence in which the items were added.
     *
     * @return {qx.ui.core.Widget[]} List of items.
     */
    getSelection : function() {
      return true;
    },

    /**
     * Replaces current selection with the given items.
     *
     * @param items {qx.ui.core.Widget[]} Items to select.
     * @throws {Error} if the item is not a child element.
     */
    setSelection : function(items) {
      return arguments.length == 1;
    },

    /**
     * Clears the whole selection at once.
     */
    resetSelection : function() {
      return true;
    },

    /**
     * Detects whether the given item is currently selected.
     *
     * @param item {qx.ui.core.Widget} Any valid selectable item
     * @return {Boolean} Whether the item is selected.
     * @throws {Error} if the item is not a child element.
     */
    isSelected : function(item) {
      return arguments.length == 1;
    },

    /**
     * Whether the selection is empty.
     *
     * @return {Boolean} Whether the selection is empty.
     */
    isSelectionEmpty : function() {
      return true;
    },

    /**
     * Returns all elements which are selectable.
     *
     * @param all {Boolean} true for all selectables, false for the
     *   selectables the user can interactively select
     * @return {qx.ui.core.Widget[]} The contained items.
     */
    getSelectables: function(all) {
      return arguments.length == 1;
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * The resetter is responsible for managing a set of items and resetting these
 * items on a {@link #reset} call. It can handle all form items supplying a
 * value property and all widgets implementing the single selection linked list
 * or select box.
 */
qx.Class.define("qx.ui.form.Resetter",
{
  extend : qx.core.Object,


  construct : function()
  {
    this.base(arguments);

    this.__items = [];
  },

  members :
  {
    __items : null,

    /**
     * Adding a widget to the reseter will get its current value and store
     * it for resetting. To access the value, the given item needs to specify
     * a value property or implement the {@link qx.ui.core.ISingleSelection}
     * interface.
     *
     * @param item {qx.ui.core.Widget} The widget which should be added.
     */
    add : function(item) {
      // check the init values
      if (this._supportsValue(item)) {
        var init = item.getValue();
      } else if (this.__supportsSingleSelection(item)) {
        var init = item.getSelection();
      } else if (this.__supportsDataBindingSelection(item)) {
        var init = item.getSelection().concat();
      } else {
        throw new Error("Item " + item + " not supported for reseting.");
      }
      // store the item and its init value
      this.__items.push({item: item, init: init});
    },


    /**
     * Resets all added form items to their initial value. The initial value
     * is the value in the widget during the {@link #add}.
     */
    reset: function() {
      // reset all form items
      for (var i = 0; i < this.__items.length; i++) {
        var dataEntry = this.__items[i];
        // set the init value
        this.__setItem(dataEntry.item, dataEntry.init);
      }
    },


    /**
     * Resets a single given item. The item has to be added to the resetter
     * instance before. Otherwise, an error is thrown.
     *
     * @param item {qx.ui.core.Widget} The widget, which should be resetted.
     */
    resetItem : function(item)
    {
      // get the init value
      var init;
      for (var i = 0; i < this.__items.length; i++) {
        var dataEntry = this.__items[i];
        if (dataEntry.item === item) {
          init = dataEntry.init;
          break;
        }
      };

      // check for the available init value
      if (init === undefined) {
        throw new Error("The given item has not been added.");
      }

      this.__setItem(item, init);
    },


    /**
     * Internal helper for setting an item to a given init value. It checks
     * for the supported APIs and uses the fitting API.
     *
     * @param item {qx.ui.core.Widget} The item to reset.
     * @param init {var} The value to set.
     */
    __setItem : function(item, init)
    {
      // set the init value
      if (this._supportsValue(item)) {
        item.setValue(init);
      } else if (
        this.__supportsSingleSelection(item) ||
        this.__supportsDataBindingSelection(item)
      ) {
        item.setSelection(init);
      }
    },


    /**
     * Takes the current values of all added items and uses these values as
     * init values for resetting.
     */
    redefine: function() {
      // go threw all added items
      for (var i = 0; i < this.__items.length; i++) {
        var item = this.__items[i].item;
        // set the new init value for the item
        this.__items[i].init = this.__getCurrentValue(item);
      }
    },


    /**
     * Takes the current value of the given item and stores this value as init
     * value for resetting.
     *
     * @param item {qx.ui.core.Widget} The item to redefine.
     */
    redefineItem : function(item)
    {
      // get the data entry
      var dataEntry;
      for (var i = 0; i < this.__items.length; i++) {
        if (this.__items[i].item === item) {
          dataEntry = this.__items[i];
          break;
        }
      };

      // check for the available init value
      if (dataEntry === undefined) {
        throw new Error("The given item has not been added.");
      }

      // set the new init value for the item
      dataEntry.init = this.__getCurrentValue(dataEntry.item);
    },


    /**
     * Internal helper top access the value of a given item.
     *
     * @param item {qx.ui.core.Widget} The item to access.
     * @return {var} The item's value
     */
    __getCurrentValue : function(item)
    {
      if (this._supportsValue(item)) {
        return item.getValue();
      } else if (
        this.__supportsSingleSelection(item) ||
        this.__supportsDataBindingSelection(item)
      ) {
        return item.getSelection();
      }
    },


    /**
     * Returns true, if the given item implements the
     * {@link qx.ui.core.ISingleSelection} interface.
     *
     * @param formItem {qx.core.Object} The item to check.
     * @return {Boolean} true, if the given item implements the
     *   necessary interface.
     */
    __supportsSingleSelection : function(formItem) {
      var clazz = formItem.constructor;
      return qx.Class.hasInterface(clazz, qx.ui.core.ISingleSelection);
    },


    /**
     * Returns true, if the given item implements the
     * {@link qx.data.controller.ISelection} interface.
     *
     * @param formItem {qx.core.Object} The item to check.
     * @return {Boolean} true, if the given item implements the
     *   necessary interface.
     */
    __supportsDataBindingSelection : function(formItem) {
      var clazz = formItem.constructor;
      return qx.Class.hasInterface(clazz, qx.data.controller.ISelection);
    },


    /**
     * Returns true, if the value property is supplied by the form item.
     *
     * @param formItem {qx.core.Object} The item to check.
     * @return {Boolean} true, if the given item implements the
     *   necessary interface.
     */
    _supportsValue : function(formItem) {
      var clazz = formItem.constructor;
      return (
        qx.Class.hasInterface(clazz, qx.ui.form.IBooleanForm) ||
        qx.Class.hasInterface(clazz, qx.ui.form.IColorForm) ||
        qx.Class.hasInterface(clazz, qx.ui.form.IDateForm) ||
        qx.Class.hasInterface(clazz, qx.ui.form.INumberForm) ||
        qx.Class.hasInterface(clazz, qx.ui.form.IStringForm)
      );
    }
  },


  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */
  destruct : function()
  {
    // holding references to widgets --> must set to null
    this.__items = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2012 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Interface for data binding classes offering a selection.
 */
qx.Interface.define("qx.data.controller.ISelection",
{
  members :
  {
    /**
     * Setter for the selection.
     * @param value {qx.data.IListData} The data of the selection.
     */
    setSelection : function(value) {},


    /**
     * Getter for the selection list.
     * @return {qx.data.IListData} The current selection.
     */
    getSelection : function() {},


    /**
     * Resets the selection to its default value.
     */
    resetSelection : function() {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Form interface for all form widgets which have boolean as their primary
 * data type like a checkbox.
 */
qx.Interface.define("qx.ui.form.IBooleanForm",
{
  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /** Fired when the value was modified */
    "changeValue" : "qx.event.type.Data"
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /*
    ---------------------------------------------------------------------------
      VALUE PROPERTY
    ---------------------------------------------------------------------------
    */

    /**
     * Sets the element's value.
     *
     * @param value {Boolean|null} The new value of the element.
     */
    setValue : function(value) {
      return arguments.length == 1;
    },


    /**
     * Resets the element's value to its initial value.
     */
    resetValue : function() {},


    /**
     * The element's user set value.
     *
     * @return {Boolean|null} The value.
     */
    getValue : function() {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Form interface for all form widgets which have boolean as their primary
 * data type like a colorchooser.
 */
qx.Interface.define("qx.ui.form.IColorForm",
{
  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /** Fired when the value was modified */
    "changeValue" : "qx.event.type.Data"
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /*
    ---------------------------------------------------------------------------
      VALUE PROPERTY
    ---------------------------------------------------------------------------
    */

    /**
     * Sets the element's value.
     *
     * @param value {Color|null} The new value of the element.
     */
    setValue : function(value) {
      return arguments.length == 1;
    },


    /**
     * Resets the element's value to its initial value.
     */
    resetValue : function() {},


    /**
     * The element's user set value.
     *
     * @return {Color|null} The value.
     */
    getValue : function() {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Form interface for all form widgets which have date as their primary
 * data type like datechooser's.
 */
qx.Interface.define("qx.ui.form.IDateForm",
{
  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /** Fired when the value was modified */
    "changeValue" : "qx.event.type.Data"
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /*
    ---------------------------------------------------------------------------
      VALUE PROPERTY
    ---------------------------------------------------------------------------
    */

    /**
     * Sets the element's value.
     *
     * @param value {Date|null} The new value of the element.
     */
    setValue : function(value) {
      return arguments.length == 1;
    },


    /**
     * Resets the element's value to its initial value.
     */
    resetValue : function() {},


    /**
     * The element's user set value.
     *
     * @return {Date|null} The value.
     */
    getValue : function() {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Form interface for all form widgets which use a numeric value as their
 * primary data type like a spinner.
 */
qx.Interface.define("qx.ui.form.INumberForm",
{
  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /** Fired when the value was modified */
    "changeValue" : "qx.event.type.Data"
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /*
    ---------------------------------------------------------------------------
      VALUE PROPERTY
    ---------------------------------------------------------------------------
    */

    /**
     * Sets the element's value.
     *
     * @param value {Number|null} The new value of the element.
     */
    setValue : function(value) {
      return arguments.length == 1;
    },


    /**
     * Resets the element's value to its initial value.
     */
    resetValue : function() {},


    /**
     * The element's user set value.
     *
     * @return {Number|null} The value.
     */
    getValue : function() {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Tino Butz (tbtz)

************************************************************************ */

/**
 * Representation of a form. A form widget can contain one or more {@link Row} widgets.
 *
 * *Example*
 *
 * Here is an example of how to use the widget.
 *
 * <pre class='javascript'>
 *   var title = new qx.ui.mobile.form.Title("Group");
 *   var form = new qx.ui.mobile.form.Form();
 *   form.add(new qx.ui.mobile.form.TextField(), "Username: ");
 *
 *   this.getRoot().add(title);
 *   this.getRoot().add(new qx.ui.mobile.form.renderer.Single(form));
 * </pre>
 *
 * This example creates a form and adds a row with a text field in it.
 */
qx.Class.define("qx.ui.mobile.form.Form",
{
  extend : qx.ui.form.Form,

  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function()
  {
    this.base(arguments);
    this.__invalidItems = [];
  },

  members :
  {
    /**
     * the renderer this form uses to be displayed
     */
    __renderer : null,


    /**
     * Contains all invalid items.
     */
    __invalidItems : null,


    // overridden
    _createResetter : function() {
      return new qx.ui.mobile.form.Resetter();
    },


    /**
     * Setter for the renderer private variable
     * @param renderer {qx.ui.mobile.form.renderer.AbstractRenderer} the renderer
     */
    setRenderer : function(renderer)
    {
      this.__renderer = renderer;
    },


    /**
     * Validates the form using the
     * {@link qx.ui.form.validation.Manager#validate} method.
     * @lint ignoreDeprecated(alert)
     *
     * @return {Boolean | null} The validation result.
     */
    validate : function()
    {
      var validateResult = this.base(arguments);

      this.__invalidItems = [];

      if(this.__renderer != null) {
        this.__renderer.resetForm();
      }
      var groups = this.getGroups();
      for (var i = 0; i < groups.length; i++)
      {
        var group = groups[i];
        for(var j=0; j < group.items.length; j++)
        {
          var item = group.items[j];
          if(!item.isValid())
          {
            this.__invalidItems.push(item);

            if(this.__renderer != null)
            {
              this.__renderer.showErrorForItem(item);
            }
            else
            {
              alert('error '+item.getInvalidMessage());
            }
          }
        }
      }

      if(this.__renderer != null) {
        this.__renderer._domUpdated();
      }

      return validateResult;
    },


    /**
     * Makes a row visible, identified by its group and row index.
     * @param groupIndex {Integer} the index of the group to which the row belongs to
     * @param rowIndex {Integer} the index of the row inside the target group
     */
    showRow : function(groupIndex,rowIndex) {
      var item = this._getItemByIndex(groupIndex, rowIndex);
      if(item) {
        this.__renderer.showItem(item);
      }
    },


    /**
     * Makes a row invisible, identified by its group and row index.
     * @param groupIndex {Integer} the index of the group to which the row belongs to
     * @param rowIndex {Integer} the index of the row inside the target group
     */
    hideRow : function(groupIndex, rowIndex) {
      var item = this._getItemByIndex(groupIndex, rowIndex);
      if(item) {
        this.__renderer.hideItem(item);
      }
    },


    /**
     * Gets the item with the given group and rowIndex.
     * @param groupIndex {Integer} the index of the group to which the row belongs to
     * @param rowIndex {Integer} the index of the row inside the target group
     * @return {qx.ui.form.IForm | null} The validation result.
     */
    _getItemByIndex : function(groupIndex, rowIndex) {
      var groups = this.getGroups();
      var group = groups[groupIndex];
      if(group) {
        var item = group.items[rowIndex];
        return item;
      }

      return null;
    },


    /**
    * Returns the invalid items of the form, which were determined by {@link qx.ui.mobile.form.Form#validate} before.
    * It returns an empty array if no items are invalid.
    * @return {qx.ui.mobile.core.Widget[]} The invalid items of the form.
    */
    getInvalidItems : function() {
      return this.__invalidItems;
    }
  }

});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2010-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Tino Butz (tbtz)

************************************************************************ */

/**
* The resetter is responsible for managing a set of items and resetting these
* items on a {@link qx.ui.mobile.form.Resetter#reset} call.
*/
qx.Class.define("qx.ui.mobile.form.Resetter",
{
  extend : qx.ui.form.Resetter,

  members :
  {
     // override
    _supportsValue : function(formItem) {
      var clazz = formItem.constructor;
      return ( this.base(arguments,formItem) ||
        qx.Class.hasMixin(clazz, qx.ui.mobile.form.MValue)
      );
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)
     * Tristan Koch (tristankoch)

************************************************************************ */

/**
 * The JSON data store is responsible for fetching data from an url. The type
 * of the data has to be json.
 *
 * The loaded data will be parsed and saved in qooxdoo objects. Every value
 * of the loaded data will be stored in a qooxdoo property. The model classes
 * for the data will be created automatically.
 *
 * For the fetching itself it uses the {@link qx.io.request.Xhr} class and
 * for parsing the loaded javascript objects into qooxdoo objects, the
 * {@link qx.data.marshal.Json} class will be used.
 *
 * Please note that if you
 *
 * * upgrade from qooxdoo 1.4 or lower
 * * choose not to force the old transport
 * * use a delegate with qx.data.store.IStoreDelegate#configureRequest
 *
 * you probably need to change the implementation of your delegate to configure
 * the {@link qx.io.request.Xhr} request.
 *
 */
qx.Class.define("qx.data.store.Json",
{
  extend : qx.core.Object,


  /**
   * @param url {String|null} The url where to find the data. The store starts
   *   loading as soon as the URL is give. If you want to change some details
   *   concerning the request, add null here and set the URL as soon as
   *   everything is set up.
   * @param delegate {Object?null} The delegate containing one of the methods
   *   specified in {@link qx.data.store.IStoreDelegate}.
   */
  construct : function(url, delegate)
  {
    this.base(arguments);


    // store the marshaler and the delegate
    this._marshaler = new qx.data.marshal.Json(delegate);
    this._delegate = delegate;

    if (url != null) {
      this.setUrl(url);
    }
  },


  events :
  {
    /**
     * Data event fired after the model has been created. The data will be the
     * created model.
     */
    "loaded" : "qx.event.type.Data",

    /**
     * Fired when an error (aborted, timeout or failed) occurred
     * during the load. The data contains the respons of the request.
     * If you want more details, use the {@link #changeState} event.
     */
    "error" : "qx.event.type.Data"
  },


  properties :
  {
    /**
     * Property for holding the loaded model instance.
     */
    model : {
      nullable: true,
      event: "changeModel"
    },


    /**
     * The state of the request as an url. If you want to check if the request
     * did it’s job, use, the {@link #changeState} event and check for one of the
     * listed values.
     */
    state : {
      check : [
        "configured", "queued", "sending", "receiving",
        "completed", "aborted", "timeout", "failed"
      ],
      init : "configured",
      event : "changeState"
    },


    /**
     * The url where the request should go to.
     */
    url : {
      check: "String",
      apply: "_applyUrl",
      event: "changeUrl",
      nullable: true
    }
  },


  members :
  {
    _marshaler : null,
    _delegate : null,

    __request : null,

    // apply function
    _applyUrl: function(value, old) {
      if (value != null) {
        // take care of the resource management
        value = qx.util.AliasManager.getInstance().resolve(value);
        value = qx.util.ResourceManager.getInstance().toUri(value);

        this._createRequest(value);
      }
    },

    /**
     * Get request
     *
     * @return {Object} The request.
     */
    _getRequest: function() {
      return this.__request;
    },


    /**
     * Set request.
     *
     * @param request {Object} The request.
     */
    _setRequest: function(request) {
      this.__request = request;
    },


    /**
     * Creates and sends a GET request with the given url.
     *
     * Listeners will be added to respond to the request’s "success",
     * "changePhase" and "fail" event.
     *
     * @param url {String} The url for the request.
     */
    _createRequest: function(url) {
      // dispose old request
      if (this.__request) {
        this.__request.dispose();
        this.__request = null;
      }

      var req = new qx.io.request.Xhr(url);
      this._setRequest(req);

      // request json representation
      req.setAccept("application/json");

      // parse as json no matter what content type is returned
      req.setParser("json");

      // register the internal event before the user has the change to
      // register its own event in the delegate
      req.addListener("success", this._onSuccess, this);

      // check for the request configuration hook
      var del = this._delegate;
      if (del && qx.lang.Type.isFunction(del.configureRequest)) {
        this._delegate.configureRequest(req);
      }

      // map request phase to it’s own phase
      req.addListener("changePhase", this._onChangePhase, this);

      // add failed, aborted and timeout listeners
      req.addListener("fail", this._onFail, this);

      req.send();
    },


    /**
     * Handler called when request phase changes.
     *
     * Sets the store’s state.
     *
     * @param ev {qx.event.type.Data} The request’s changePhase event.
     */
    _onChangePhase : function(ev) {
      var requestPhase = ev.getData(),
          requestPhaseToStorePhase = {},
          state;

      requestPhaseToStorePhase = {
        "opened": "configured",
        "sent": "sending",
        "loading": "receiving",
        "success": "completed",
        "abort": "aborted",
        "timeout": "timeout",
        "statusError": "failed"
      };

      state = requestPhaseToStorePhase[requestPhase];
      if (state) {
        this.setState(state);
      }
    },


    /**
     * Handler called when not completing the request successfully.
     *
     * @param ev {qx.event.type.Event} The request’s fail event.
     */
    _onFail : function(ev) {
      var req = ev.getTarget();
      this.fireDataEvent("error", req);
    },


    /**
     * Handler for the completion of the requests. It invokes the creation of
     * the needed classes and instances for the fetched data using
     * {@link qx.data.marshal.Json}.
     *
     * @param ev {qx.event.type.Event} The request’s success event.
     */
    _onSuccess : function(ev)
    {
      if (this.isDisposed()) {
        return;
      }

       var req = ev.getTarget(),
           data = req.getResponse();

       // check for the data manipulation hook
       var del = this._delegate;
       if (del && qx.lang.Type.isFunction(del.manipulateData)) {
         data = this._delegate.manipulateData(data);
       }

       // create the class
       this._marshaler.toClass(data, true);

       var oldModel = this.getModel();

       // set the initial data
       this.setModel(this._marshaler.toModel(data));

       // get rid of the old model
       if (oldModel && oldModel.dispose) {
         oldModel.dispose();
       }

       // fire complete event
       this.fireDataEvent("loaded", this.getModel());

       // get rid of the request object
       if (this.__request) {
         this.__request.dispose();
         this.__request = null;
       }
    },


    /**
     * Reloads the data with the url set in the {@link #url} property.
     */
    reload: function() {
      var url = this.getUrl();
      if (url != null) {
        this._createRequest(url);
      }
    }
  },

  /*
   *****************************************************************************
      DESTRUCT
   *****************************************************************************
   */

  destruct : function()
  {
    if (this.__request != null) {
      this._disposeObjects("__request");
    }

    // The marshaler internally uses the singleton pattern
    // (constructor.$$instance.
    this._disposeSingletonObjects("_marshaler");
    this._delegate = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * Defines the methods needed by every marshaler which should work with the
 * qooxdoo data stores.
 */
qx.Interface.define("qx.data.marshal.IMarshaler",
{
  members :
  {
    /**
     * Creates for the given data the needed classes. The classes contain for
     * every key in the data a property. The classname is always the prefix
     * <code>qx.data.model</code>. Two objects containing the same keys will not
     * create two different classes.
     *
     * @param data {Object} The object for which classes should be created.
     * @param includeBubbleEvents {Boolean} Whether the model should support
     *   the bubbling of change events or not.
     */
    toClass : function(data, includeBubbleEvents) {},


    /**
     * Creates for the given data the needed models. Be sure to have the classes
     * created with {@link #toClass} before calling this method.
     *
     * @param data {Object} The object for which models should be created.
     *
     * @return {qx.core.Object} The created model object.
     */
    toModel : function(data) {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * This class is responsible for converting json data to class instances
 * including the creation of the classes.
 */
qx.Class.define("qx.data.marshal.Json",
{
  extend : qx.core.Object,
  implement : [qx.data.marshal.IMarshaler],

  /**
   * @param delegate {Object} An object containing one of the methods described
   *   in {@link qx.data.marshal.IMarshalerDelegate}.
   */
  construct : function(delegate)
  {
    this.base(arguments);

    this.__delegate = delegate;
  },

  statics :
  {
    $$instance : null,

    /**
     * Creates a qooxdoo object based on the given json data. This function
     * is just a static wrapper. If you want to configure the creation
     * process of the class, use {@link qx.data.marshal.Json} directly.
     *
     * @param data {Object} The object for which classes should be created.
     * @param includeBubbleEvents {Boolean} Whether the model should support
     *   the bubbling of change events or not.
     *
     * @return {qx.core.Object} An instance of the corresponding class.
     */
    createModel : function(data, includeBubbleEvents) {
      // singleton for the json marshaler
      if (this.$$instance === null) {
        this.$$instance = new qx.data.marshal.Json();
      }
      // be sure to create the classes first
      this.$$instance.toClass(data, includeBubbleEvents);
      // return the model
      return this.$$instance.toModel(data);
    }
  },


  members :
  {
    __delegate : null,


    /**
     * Converts a given object into a hash which will be used to identify the
     * classes under the namespace <code>qx.data.model</code>.
     *
     * @param data {Object} The JavaScript object from which the hash is
     *   required.
     * @return {String} The hash representation of the given JavaScript object.
     */
    __jsonToHash: function(data) {
      return Object.keys(data).sort().join('"');
    },


    /**
     * Creates for the given data the needed classes. The classes contain for
     * every key in the data a property. The classname is always the prefix
     * <code>qx.data.model</code> and the hash of the data created by
     * {@link #__jsonToHash}. Two objects containing the same keys will not
     * create two different classes. The class creation process also supports
     * the functions provided by its delegate.
     *
     * Important, please keep in mind that only valid JavaScript identifiers
     * can be used as keys in the data map. For convenience '-' in keys will
     * be removed (a-b will be ab in the end).
     *
     * @see qx.data.store.IStoreDelegate
     *
     * @param data {Object} The object for which classes should be created.
     * @param includeBubbleEvents {Boolean} Whether the model should support
     *   the bubbling of change events or not.
     */
    toClass: function(data, includeBubbleEvents) {
      this.__toClass(data, includeBubbleEvents, null, 0);
    },


    /**
     * Implementation of {@link #toClass} used for recursion.
     *
     * @param data {Object} The object for which classes should be created.
     * @param includeBubbleEvents {Boolean} Whether the model should support
     *   the bubbling of change events or not.
     * @param parentProperty {String|null} The name of the property the
     *   data will be stored in.
     * @param depth {Number} The depth of the data relative to the data's root.
     */
    __toClass : function(data, includeBubbleEvents, parentProperty, depth) {
      // break on all primitive json types and qooxdoo objects
      if (
        !qx.lang.Type.isObject(data)
        || !!data.$$isString // check for localized strings
        || data instanceof qx.core.Object
      ) {
        // check for arrays
        if (data instanceof Array || qx.Bootstrap.getClass(data) == "Array") {
          for (var i = 0; i < data.length; i++) {
            this.__toClass(data[i], includeBubbleEvents, null, depth+1);
          }
        }

        // ignore arrays and primitive types
        return;
      }

      var hash = this.__jsonToHash(data);

      // ignore rules
      if (this.__ignore(hash, parentProperty, depth)) {
        return;
      }

      // check for the possible child classes
      for (var key in data) {
        this.__toClass(data[key], includeBubbleEvents, key, depth+1);
      }

      // class already exists
      if (qx.Class.isDefined("qx.data.model." + hash)) {
        return;
      }

      // class is defined by the delegate
      if (
        this.__delegate
        && this.__delegate.getModelClass
        && this.__delegate.getModelClass(hash, data) != null
      ) {
        return;
      }

      // create the properties map
      var properties = {};
      // include the disposeItem for the dispose process.
      var members = {__disposeItem : this.__disposeItem};
      for (var key in data) {
        // apply the property names mapping
        if (this.__delegate && this.__delegate.getPropertyMapping) {
          key = this.__delegate.getPropertyMapping(key, hash);
        }

        // stip the unwanted characters
        key = key.replace(/-|\.|\s+/g, "");
        // check for valid JavaScript identifier (leading numbers are ok)
        if (qx.core.Environment.get("qx.debug")) {
          this.assertTrue((/^[$0-9A-Za-z_]*$/).test(key),
          "The key '" + key + "' is not a valid JavaScript identifier.")
        }

        properties[key] = {};
        properties[key].nullable = true;
        properties[key].event = "change" + qx.lang.String.firstUp(key);
        // bubble events
        if (includeBubbleEvents) {
          properties[key].apply = "_applyEventPropagation";
        }
        // validation rules
        if (this.__delegate && this.__delegate.getValidationRule) {
          var rule = this.__delegate.getValidationRule(hash, key);
          if (rule) {
            properties[key].validate = "_validate" + key;
            members["_validate" + key] = rule;
          }
        }
      }

      // try to get the superclass, qx.core.Object as default
      if (this.__delegate && this.__delegate.getModelSuperClass) {
        var superClass =
          this.__delegate.getModelSuperClass(hash) || qx.core.Object;
      } else {
        var superClass = qx.core.Object;
      }

      // try to get the mixins
      var mixins = [];
      if (this.__delegate && this.__delegate.getModelMixins) {
        var delegateMixins = this.__delegate.getModelMixins(hash);
        // check if its an array
        if (!qx.lang.Type.isArray(delegateMixins)) {
          if (delegateMixins != null) {
            mixins = [delegateMixins];
          }
        } else {
          mixins = delegateMixins;
        }
      }

      // include the mixin for the event bubbling
      if (includeBubbleEvents) {
        mixins.push(qx.data.marshal.MEventBubbling);
      }

      // create the map for the class
      var newClass = {
        extend : superClass,
        include : mixins,
        properties : properties,
        members : members,
        destruct : this.__disposeProperties
      };

      qx.Class.define("qx.data.model." + hash, newClass);
    },


    /**
     * Destructor for all created classes which disposes all stuff stored in
     * the properties.
     */
    __disposeProperties : function() {
      var properties = qx.util.PropertyUtil.getAllProperties(this.constructor);
      for (var desc in properties) {
        this.__disposeItem(this.get(properties[desc].name));
      };
    },


    /**
     * Helper for disposing items of the created class.
     *
     * @param item {var} The item to dispose.
     */
    __disposeItem : function(item) {
      if (!(item instanceof qx.core.Object)) {
        // ignore all non objects
        return;
      }
      // ignore already disposed items (could happen during shutdown)
      if (item.isDisposed()) {
        return;
      }
      item.dispose();
    },


    /**
     * Creates an instance for the given data hash.
     *
     * @param hash {String} The hash of the data for which an instance should
     *   be created.
     * @param data {Map} The data for which an instance should be created.
     * @return {qx.core.Object} An instance of the corresponding class.
     */
    __createInstance: function(hash, data) {
      var delegateClass;
      // get the class from the delegate
      if (this.__delegate && this.__delegate.getModelClass) {
        delegateClass = this.__delegate.getModelClass(hash, data);
      }
      if (delegateClass != null) {
        return (new delegateClass());
      } else {
        var className = "qx.data.model." + hash;
        var clazz = qx.Class.getByName(className);
        if (!clazz) {
          throw new Error("Class '" + className + "' could not be found.");
        }
        return (new clazz());
      }
    },


    /**
     * Helper to decide if the delegate decides to ignore a data set.
     * @param hash {String} The property names.
     * @param parentProperty {String|null} The name of the property the data
     *   will be stored in.
     * @param depth {Number} The depth of the object relative to the data root.
     * @return {Boolean} <code>true</code> if the set should be ignored
     */
    __ignore : function(hash, parentProperty, depth) {
      var del = this.__delegate;
      return del && del.ignore && del.ignore(hash, parentProperty, depth);
    },


    /**
     * Creates for the given data the needed models. Be sure to have the classes
     * created with {@link #toClass} before calling this method. The creation
     * of the class itself is delegated to the {@link #__createInstance} method,
     * which could use the {@link qx.data.store.IStoreDelegate} methods, if
     * given.
     *
     * @param data {Object} The object for which models should be created.
     *
     * @return {qx.core.Object} The created model object.
     */
    toModel: function(data) {
      return this.__toModel(data, null, 0);
    },


    /**
     * Implementation of {@link #toModel} used for recursion.
     *
     * @param data {Object} The object for which models should be created.
     * @param parentProperty {String|null} The name of the property the
     *   data will be stored in.
     * @param depth {Number} The depth of the data relative to the data's root.
     * @return {qx.core.Object} The created model object.
     */
    __toModel: function(data, parentProperty, depth) {
      var isObject = qx.lang.Type.isObject(data);
      var isArray = data instanceof Array || qx.Bootstrap.getClass(data) == "Array";

      if (
        (!isObject && !isArray)
        || !!data.$$isString // check for localized strings
        || data instanceof qx.core.Object
      ) {
        return data;

      // ignore rules
      } else if (this.__ignore(this.__jsonToHash(data), parentProperty, depth)) {
        return data;

      } else if (isArray) {
        var array = new qx.data.Array();
        // set the auto dispose for the array
        array.setAutoDisposeItems(true);

        for (var i = 0; i < data.length; i++) {
          array.push(this.__toModel(data[i], null, depth+1));
        }
        return array;

      } else if (isObject) {
        // create an instance for the object
        var hash = this.__jsonToHash(data);
        var model = this.__createInstance(hash, data);

        // go threw all element in the data
        for (var key in data) {
          // apply the property names mapping
          var propertyName = key;
          if (this.__delegate && this.__delegate.getPropertyMapping) {
            propertyName = this.__delegate.getPropertyMapping(key, hash);
          }
          var propertyNameReplaced = propertyName.replace(/-|\.|\s+/g, "");
          // warn if there has been a replacement
          if (
            (qx.core.Environment.get("qx.debug")) &&
            qx.core.Environment.get("qx.debug.databinding")
          ) {
            if (propertyNameReplaced != propertyName) {
              this.warn(
                "The model contained an illegal name: '" + key +
                "'. Replaced it with '" + propertyName + "'."
              );
            }
          }
          propertyName = propertyNameReplaced;
          // only set the properties if they are available [BUG #5909]
          var setterName = "set" + qx.lang.String.firstUp(propertyName);
          if (model[setterName]) {
            model[setterName](this.__toModel(data[key], key, depth+1));
          }
        }
        return model;
      }

      throw new Error("Unsupported type!");
    }
  },

  /*
   *****************************************************************************
      DESTRUCT
   *****************************************************************************
   */

  destruct : function() {
    this.__delegate = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Mixin used for the bubbling events. If you want to use this in your own model
 * classes, be sure that every property will call the
 * {@link #_applyEventPropagation} function on every change.
 */
qx.Mixin.define("qx.data.marshal.MEventBubbling",
{

  events :
  {
    /**
     * The change event which will be fired on every change in the model no
     * matter what property changes. This event bubbles so the root model will
     * fire a change event on every change of its children properties too.
     *
     * Note that properties are required to call
     * {@link #_applyEventPropagation} on apply for changes to be tracked as
     * desired. It is already taken care of that properties created with the
     * {@link qx.data.marshal.Json} marshaler call this method.
     *
     * The data will contain a map with the following three keys
     *   <li>value: The new value of the property</li>
     *   <li>old: The old value of the property.</li>
     *   <li>name: The name of the property changed including its parent
     *     properties separated by dots.</li>
     *   <li>item: The item which has the changed property.</li>
     * Due to that, the <code>getOldData</code> method will always return null
     * because the old data is contained in the map.
     */
    "changeBubble": "qx.event.type.Data"
  },


  members :
  {
    /**
     * Apply function for every property created with the
     * {@link qx.data.marshal.Json} marshaler. It fires and
     * {@link #changeBubble} event on every change. It also adds the chaining
     * listener if possible which is necessary for the bubbling of the events.
     *
     * @param value {var} The new value of the property.
     * @param old {var} The old value of the property.
     * @param name {String} The name of the changed property.
     */
    _applyEventPropagation : function(value, old, name)
    {
      this.fireDataEvent("changeBubble", {
        value: value, name: name, old: old, item: this
      });

      this._registerEventChaining(value, old, name);
    },


    /**
     * Registers for the given parameters the changeBubble listener, if
     * possible. It also removes the old listener, if an old item with
     * a changeBubble event is given.
     *
     * @param value {var} The new value of the property.
     * @param old {var} The old value of the property.
     * @param name {String} The name of the changed property.
     */
    _registerEventChaining : function(value, old, name)
    {
      // if an old value is given, remove the old listener if possible
      if (old != null && old.getUserData && old.getUserData("idBubble-" + this.$$hash) != null) {
        var listeners = old.getUserData("idBubble-" + this.$$hash);
        for (var i = 0; i < listeners.length; i++) {
          old.removeListenerById(listeners[i]);
        }
        old.setUserData("idBubble-" + this.$$hash, null);
      }

      // if the child supports chaining
      if ((value instanceof qx.core.Object)
        && qx.Class.hasMixin(value.constructor, qx.data.marshal.MEventBubbling)
      ) {
        // create the listener
        var listener = qx.lang.Function.bind(
          this.__changePropertyListener, this, name
        );
        // add the listener
        var id = value.addListener("changeBubble", listener, this);
        var listeners = value.getUserData("idBubble-" + this.$$hash);
        if (listeners == null)
        {
          listeners = [];
          value.setUserData("idBubble-" + this.$$hash, listeners);
        }
        listeners.push(id);
      }
    },


    /**
     * Listener responsible for formating the name and firing the change event
     * for the changed property.
     *
     * @param name {String} The name of the former properties.
     * @param e {qx.event.type.Data} The date event fired by the property
     *   change.
     */
    __changePropertyListener : function(name, e)
    {
      var data = e.getData();
      var value = data.value;
      var old = data.old;

      // if the target is an array
      if (qx.Class.hasInterface(e.getTarget().constructor, qx.data.IListData)) {

        if (data.name.indexOf) {
          var dotIndex = data.name.indexOf(".") != -1 ? data.name.indexOf(".") : data.name.length;
          var bracketIndex = data.name.indexOf("[") != -1 ? data.name.indexOf("[") : data.name.length;

          // braktes in the first spot is ok [BUG #5985]
          if (bracketIndex == 0) {
            var newName = name + data.name;
          } else if (dotIndex < bracketIndex) {
            var index = data.name.substring(0, dotIndex);
            var rest = data.name.substring(dotIndex + 1, data.name.length);
            if (rest[0] != "[") {
              rest = "." + rest;
            }
            var newName =  name + "[" + index + "]" + rest;
          } else if (bracketIndex < dotIndex) {
            var index = data.name.substring(0, bracketIndex);
            var rest = data.name.substring(bracketIndex, data.name.length);
            var newName =  name + "[" + index + "]" + rest;
          } else {
            var newName =  name + "[" + data.name + "]";
          }
        } else {
          var newName =  name + "[" + data.name + "]";
        }

      // if the target is not an array
      } else {
        // special case for array as first element of the chain [BUG #5985]
        if (parseInt(name) == name && name !== "") {
          name = "[" + name + "]";
        }
        var newName =  name + "." + data.name;
      }

      this.fireDataEvent(
        "changeBubble",
        {
          value: value,
          name: newName,
          old: old,
          item: data.item || e.getTarget()
        }
      );
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * The data array is a special array used in the data binding context of
 * qooxdoo. It does not extend the native array of JavaScript but its a wrapper
 * for it. All the native methods are included in the implementation and it
 * also fires events if the content or the length of the array changes in
 * any way. Also the <code>.length</code> property is available on the array.
 */
qx.Class.define("qx.data.Array",
{
  extend : qx.core.Object,
  include : qx.data.marshal.MEventBubbling,
  implement : [qx.data.IListData],

  /**
   * Creates a new instance of an array.
   *
   * @param param {var} The parameter can be some types.<br/>
   *   Without a parameter a new blank array will be created.<br/>
   *   If there is more than one parameter is given, the parameter will be
   *   added directly to the new array.<br/>
   *   If the parameter is a number, a new Array with the given length will be
   *   created.<br/>
   *   If the parameter is a JavaScript array, a new array containing the given
   *   elements will be created.
   */
  construct : function(param)
  {
    this.base(arguments);
    // if no argument is given
    if (param == undefined) {
      this.__array = [];

    // check for elements (create the array)
    } else if (arguments.length > 1) {
      // create an empty array and go through every argument and push it
      this.__array = [];
      for (var i = 0; i < arguments.length; i++) {
        this.__array.push(arguments[i]);
      }

    // check for a number (length)
    } else if (typeof param == "number") {
      this.__array = new Array(param);
    // check for an array itself
    } else if (param instanceof Array) {
      this.__array = qx.lang.Array.clone(param);

    // error case
    } else {
      this.__array = [];
      this.dispose();
      throw new Error("Type of the parameter not supported!");
    }

    // propagate changes
    for (var i=0; i<this.__array.length; i++) {
      this._applyEventPropagation(this.__array[i], null, i);
    }

    // update the length at startup
    this.__updateLength();

    // work against the console printout of the array
    if (qx.core.Environment.get("qx.debug")) {
      this[0] = "Please use 'toArray()' to see the content.";
    }
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /**
     * Flag to set the dispose behavior of the array. If the property is set to
     * <code>true</code>, the array will dispose its content on dispose, too.
     */
    autoDisposeItems : {
      check : "Boolean",
      init : false
    }
  },

  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /**
     * The change event which will be fired if there is a change in the array.
     * The data contains a map with three key value pairs:
     * <li>start: The start index of the change.</li>
     * <li>end: The end index of the change.</li>
     * <li>type: The type of the change as a String. This can be 'add',
     * 'remove', 'order' or 'add/remove'</li>
     * <li>added: The items which has been added (as a JavaScript array)</li>
     * <li>removed: The items which has been removed (as a JavaScript array)</li>
     */
    "change" : "qx.event.type.Data",


    /**
     * The changeLength event will be fired every time the length of the
     * array changes.
     */
    "changeLength": "qx.event.type.Data"
  },


  members :
  {
    // private members
    __array : null,


    /**
     * Concatenates the current and the given array into a new one.
     *
     * @param array {Array} The javaScript array which should be concatenated
     *   to the current array.
     *
     * @return {qx.data.Array} A new array containing the values of both former
     *   arrays.
     */
    concat: function(array) {
      if (array) {
        var newArray = this.__array.concat(array);
      } else {
        var newArray = this.__array.concat();
      }
      return new qx.data.Array(newArray);
    },


    /**
     * Returns the array as a string using the given connector string to
     * connect the values.
     *
     * @param connector {String} the string which should be used to past in
     *  between of the array values.
     *
     * @return {String} The array as a string.
     */
    join: function(connector) {
      return this.__array.join(connector);
    },


    /**
     * Removes and returns the last element of the array.
     * An change event will be fired.
     *
     * @return {var} The last element of the array.
     */
    pop: function() {
      var item = this.__array.pop();
      this.__updateLength();
      // remove the possible added event listener
      this._registerEventChaining(null, item, this.length - 1);
      // fire change bubble event
      this.fireDataEvent("changeBubble", {
        value: [],
        name: this.length + "",
        old: [item],
        item: this
      });

      this.fireDataEvent("change",
        {
          start: this.length - 1,
          end: this.length - 1,
          type: "remove",
          removed : [item],
          added : []
        }, null
      );
      return item;
    },


    /**
     * Adds an element at the end of the array.
     *
     * @param varargs {var} Multiple elements. Every element will be added to
     *   the end of the array. An change event will be fired.
     *
     * @return {Number} The new length of the array.
     */
    push: function(varargs) {
      for (var i = 0; i < arguments.length; i++) {
        this.__array.push(arguments[i]);
        this.__updateLength();
        // apply to every pushed item an event listener for the bubbling
        this._registerEventChaining(arguments[i], null, this.length - 1);

        // fire change bubbles event
        this.fireDataEvent("changeBubble", {
          value: [arguments[i]],
          name: (this.length - 1) + "",
          old: [],
          item: this
        });

        // fire change event
        this.fireDataEvent("change",
          {
            start: this.length - 1,
            end: this.length - 1,
            type: "add",
            added: [arguments[i]],
            removed : []
          }, null
        );
      }
      return this.length;
    },


    /**
     * Reverses the order of the array. An change event will be fired.
     */
    reverse: function() {
      // ignore on empty arrays
      if (this.length == 0) {
        return;
      }

      var oldArray = this.__array.concat();
      this.__array.reverse();

      this.__updateEventPropagation(0, this.length);

      this.fireDataEvent("change",
        {start: 0, end: this.length - 1, type: "order", added: [], removed: []}, null
      );

      // fire change bubbles event
      this.fireDataEvent("changeBubble", {
        value: this.__array,
        name: "0-" + (this.__array.length - 1),
        old: oldArray,
        item: this
      });
    },


    /**
     * Removes the first element of the array and returns it. An change event
     * will be fired.
     *
     * @return {var} the former first element.
     */
    shift: function() {
      // ignore on empty arrays
      if (this.length == 0) {
        return;
      }

      var item = this.__array.shift();
      this.__updateLength();
      // remove the possible added event listener
      this._registerEventChaining(null, item, this.length -1);
      // as every item has changed its position, we need to update the event bubbling
      this.__updateEventPropagation(0, this.length);

      // fire change bubbles event
      this.fireDataEvent("changeBubble", {
        value: [],
        name: "0",
        old: [item],
        item: this
      });

      // fire change event
      this.fireDataEvent("change",
        {
          start: 0,
          end: this.length -1,
          type: "remove",
          removed : [item],
          added : []
        }, null
      );
      return item;
    },


    /**
     * Returns a new array based on the range specified by the parameters.
     *
     * @param from {Number} The start index.
     * @param to {Number?null} The end index. If omitted, slice extracts to the
     *   end of the array.
     *
     * @return {qx.data.Array} A new array containing the given range of values.
     */
    slice: function(from, to) {
      return new qx.data.Array(this.__array.slice(from, to));
    },


    /**
     * Method to remove and add new elements to the array. For every remove or
     * add an event will be fired.
     *
     * @param startIndex {Integer} The index where the splice should start
     * @param amount {Integer} Defines number of elements which will be removed
     *   at the given position.
     * @param varargs {var} All following parameters will be added at the given
     *   position to the array.
     * @return {qx.data.Array} An data array containing the removed elements.
     *   Keep in to dispose this one, even if you don't use it!
     */
    splice: function(startIndex, amount, varargs) {
      // store the old length
      var oldLength = this.__array.length;

      // invoke the slice on the array
      var returnArray = this.__array.splice.apply(this.__array, arguments);

      // fire a change event for the length
      if (this.__array.length != oldLength) {
        this.__updateLength();
      } else if (amount == arguments.length - 2) {
        // if we added as much items as we removed
        var addedItems = qx.lang.Array.fromArguments(arguments, 2)
        // check if the array content equals the content before the operation
        for (var i = 0; i < addedItems.length; i++) {
          if (addedItems[i] !== returnArray[i]) {
            break;
          }
          // if all added and removed items are queal
          if (i == addedItems.length -1) {
            // prevent all events and return a new array
            return new qx.data.Array();
          }
        }
      }
      // fire an event for the change
      var removed = amount > 0;
      var added = arguments.length > 2;
      if (removed || added) {
        var addedItems = qx.lang.Array.fromArguments(arguments, 2);

        if (returnArray.length == 0) {
          var type = "add";
          var end = startIndex + addedItems.length;
        } else if (addedItems.length == 0) {
          var type = "remove";
          var end = this.length - 1;
        } else {
          var type = "add/remove";
          var end = startIndex + Math.abs(addedItems.length - returnArray.length);
        }
        this.fireDataEvent("change",
          {
            start: startIndex,
            end: end,
            type: type,
            added : addedItems,
            removed : returnArray
          }, null
        );
      }

      // remove the listeners first [BUG #7132]
      for (var i = 0; i < returnArray.length; i++) {
        this._registerEventChaining(null, returnArray[i], i);
      }

      // add listeners
      for (var i = 2; i < arguments.length; i++) {
        this._registerEventChaining(arguments[i], null, startIndex + (i - 2));
      }
      // apply event chaining for every item moved
      this.__updateEventPropagation(startIndex + (arguments.length - 2) - amount, this.length);

      // fire the changeBubble event
      var value = [];
      for (var i=2; i < arguments.length; i++) {
        value[i-2] = arguments[i];
      };
      var endIndex = (startIndex + Math.max(arguments.length - 3 , amount - 1));
      var name = startIndex == endIndex ? endIndex : startIndex + "-" + endIndex;
      this.fireDataEvent("changeBubble", {
        value: value, name: name + "", old: returnArray, item: this
      });

      return (new qx.data.Array(returnArray));
    },


    /**
     * Sorts the array. If a function is given, this will be used to
     * compare the items. <code>changeBubble</code> event will only be fired,
     * if sorting result differs from original array.
     *
     * @param func {Function} A compare function comparing two parameters and
     *   should return a number.
     */
    sort: function(func) {
      // ignore if the array is empty
      if (this.length == 0) {
        return;
      }
      var oldArray = this.__array.concat();

      this.__array.sort.apply(this.__array, arguments);

      // prevent changeBubble event if nothing has been changed
      if (qx.lang.Array.equals(this.__array, oldArray) === true){
        return;
      }

      this.__updateEventPropagation(0, this.length);

      this.fireDataEvent("change",
        {start: 0, end: this.length - 1, type: "order", added: [], removed: []}, null
      );

      // fire change bubbles event
      this.fireDataEvent("changeBubble", {
        value: this.__array,
        name: "0-" + (this.length - 1),
        old: oldArray,
        item: this
      });
    },


    /**
     * Adds the given items to the beginning of the array. For every element,
     * a change event will be fired.
     *
     * @param varargs {var} As many elements as you want to add to the beginning.
     * @return {Integer} The new length of the array
     */
    unshift: function(varargs) {
      for (var i = arguments.length - 1; i >= 0; i--) {
        this.__array.unshift(arguments[i]);
        this.__updateLength();
        // apply to every item an event listener for the bubbling
        this.__updateEventPropagation(0, this.length);

        // fire change bubbles event
        this.fireDataEvent("changeBubble", {
          value: [this.__array[0]],
          name: "0",
          old: [this.__array[1]],
          item: this
        });

        // fire change event
        this.fireDataEvent("change",
          {
            start: 0,
            end: this.length - 1,
            type: "add",
            added : [arguments[i]],
            removed : []
          }, null
        );
      }
      return this.length;
    },


    /**
     * Returns the list data as native array. Beware of the fact that the
     * internal representation will be returnd and any manipulation of that
     * can cause a misbehavior of the array. This method should only be used for
     * debugging purposes.
     *
     * @return {Array} The native array.
     */
    toArray: function() {
      return this.__array;
    },


    /**
     * Replacement function for the getting of the array value.
     * array[0] should be array.getItem(0).
     *
     * @param index {Number} The index requested of the array element.
     *
     * @return {var} The element at the given index.
     */
    getItem: function(index) {
      return this.__array[index];
    },


    /**
     * Replacement function for the setting of an array value.
     * array[0] = "a" should be array.setItem(0, "a").
     * A change event will be fired if the value changes. Setting the same
     * value again will not lead to a change event.
     *
     * @param index {Number} The index of the array element.
     * @param item {var} The new item to set.
     */
    setItem: function(index, item) {
      var oldItem = this.__array[index];
      // ignore settings of already set items [BUG #4106]
      if (oldItem === item) {
        return;
      }
      this.__array[index] = item;
      // set an event listener for the bubbling
      this._registerEventChaining(item, oldItem, index);
      // only update the length if its changed
      if (this.length != this.__array.length) {
        this.__updateLength();
      }

      // fire change bubbles event
      this.fireDataEvent("changeBubble", {
        value: [item],
        name: index + "",
        old: [oldItem],
        item: this
      });

      // fire change event
      this.fireDataEvent("change",
        {
          start: index,
          end: index,
          type: "add/remove",
          added: [item],
          removed: [oldItem]
        }, null
      );
    },


    /**
     * This method returns the current length stored under .length on each
     * array.
     *
     * @return {Number} The current length of the array.
     */
    getLength: function() {
      return this.length;
    },


    /**
     * Returns the index of the item in the array. If the item is not in the
     * array, -1 will be returned.
     *
     * @param item {var} The item of which the index should be returned.
     * @return {Number} The Index of the given item.
     */
    indexOf: function(item) {
      return this.__array.indexOf(item);
    },

    /**
     * Returns the last index of the item in the array. If the item is not in the
     * array, -1 will be returned.
     *
     * @param item {var} The item of which the index should be returned.
     * @return {Number} The Index of the given item.
     */
    lastIndexOf: function(item) {
      return this.__array.lastIndexOf(item);
    },


    /**
     * Returns the toString of the original Array
     * @return {String} The array as a string.
     */
    toString: function() {
      if (this.__array != null) {
        return this.__array.toString();
      }
      return "";
    },


    /*
    ---------------------------------------------------------------------------
       IMPLEMENTATION OF THE QX.LANG.ARRAY METHODS
    ---------------------------------------------------------------------------
    */
    /**
     * Check if the given item is in the current array.
     *
     * @param item {var} The item which is possibly in the array.
     * @return {Boolean} true, if the array contains the given item.
     */
    contains: function(item) {
      return this.__array.indexOf(item) !== -1;
    },


    /**
     * Return a copy of the given arr
     *
     * @return {qx.data.Array} copy of this
     */
    copy : function() {
      return this.concat();
    },


    /**
     * Insert an element at a given position.
     *
     * @param index {Integer} Position where to insert the item.
     * @param item {var} The element to insert.
     */
    insertAt : function(index, item)
    {
      this.splice(index, 0, item).dispose();
    },


    /**
     * Insert an item into the array before a given item.
     *
     * @param before {var} Insert item before this object.
     * @param item {var} The item to be inserted.
     */
    insertBefore : function(before, item)
    {
      var index = this.indexOf(before);

      if (index == -1) {
        this.push(item);
      } else {
        this.splice(index, 0, item).dispose();
      }
    },


    /**
     * Insert an element into the array after a given item.
     *
     * @param after {var} Insert item after this object.
     * @param item {var} Object to be inserted.
     */
    insertAfter : function(after, item)
    {
      var index = this.indexOf(after);

      if (index == -1 || index == (this.length - 1)) {
        this.push(item);
      } else {
        this.splice(index + 1, 0, item).dispose();
      }
    },


    /**
     * Remove an element from the array at the given index.
     *
     * @param index {Integer} Index of the item to be removed.
     * @return {var} The removed item.
     */
    removeAt : function(index) {
      var returnArray = this.splice(index, 1);
      var item = returnArray.getItem(0);
      returnArray.dispose();
      return item;
    },


    /**
     * Remove all elements from the array.
     *
     * @return {Array} A native array containing the removed elements.
     */
    removeAll : function() {
      // remove all possible added event listeners
      for (var i = 0; i < this.__array.length; i++) {
        this._registerEventChaining(null, this.__array[i], i);
      }

      // ignore if array is empty
      if (this.getLength() == 0) {
        return [];
      }

      // store the old data
      var oldLength = this.getLength();
      var items = this.__array.concat();

      // change the length
      this.__array.length = 0;
      this.__updateLength();

      // fire change bubbles event
      this.fireDataEvent("changeBubble", {
        value: [],
        name: "0-" + (oldLength - 1),
        old: items,
        item: this
      });

      // fire the change event
      this.fireDataEvent("change",
        {
          start: 0,
          end: oldLength - 1,
          type: "remove",
          removed : items,
          added : []
        }, null
      );
      return items;
    },


    /**
     * Append the items of the given array.
     *
     * @param array {Array|qx.data.IListData} The items of this array will
     * be appended.
     * @throws {Error} if the second argument is not an array.
     */
    append : function(array)
    {
      // qooxdoo array support
      if (array instanceof qx.data.Array) {
        array = array.toArray();
      }

      // this check is important because opera throws an uncatchable error if
      // apply is called without an array as argument.
      if (qx.core.Environment.get("qx.debug")) {
        qx.core.Assert.assertArray(array, "The parameter must be an array.");
      }

      Array.prototype.push.apply(this.__array, array);

      // add a listener to the new items
      for (var i = 0; i < array.length; i++) {
        this._registerEventChaining(array[i], null, this.__array.length + i);
      }

      var oldLength = this.length;
      this.__updateLength();

      // fire change bubbles
      var name =
        oldLength == (this.length-1) ?
        oldLength :
        oldLength + "-" + (this.length-1);
      this.fireDataEvent("changeBubble", {
        value: array,
        name: name + "",
        old: [],
        item: this
      });

      // fire the change event
      this.fireDataEvent("change",
        {
          start: oldLength,
          end: this.length - 1,
          type: "add",
          added : array,
          removed : []
        }, null
      );
    },


    /**
     * Remove the given item.
     *
     * @param item {var} Item to be removed from the array.
     * @return {var} The removed item.
     */
    remove : function(item)
    {
      var index = this.indexOf(item);

      if (index != -1)
      {
        this.splice(index, 1).dispose();
        return item;
      }
    },


    /**
     * Check whether the given array has the same content as this.
     * Checks only the equality of the arrays' content.
     *
     * @param array {qx.data.Array} The array to check.
     * @return {Boolean} Whether the two arrays are equal.
     */
    equals : function(array)
    {
      if (this.length !== array.length) {
        return false;
      }

      for (var i = 0; i < this.length; i++)
      {
        if (this.getItem(i) !== array.getItem(i)) {
          return false;
        }
      }

      return true;
    },


    /**
     * Returns the sum of all values in the array. Supports
     * numeric values only.
     *
     * @return {Number} The sum of all values.
     */
    sum : function()
    {
      var result = 0;
      for (var i = 0; i < this.length; i++) {
        result += this.getItem(i);
      }

      return result;
    },


    /**
     * Returns the highest value in the given array.
     * Supports numeric values only.
     *
     * @return {Number | null} The highest of all values or undefined if the
     *   array is empty.
     */
    max : function()
    {
      var result = this.getItem(0);

      for (var i = 1; i < this.length; i++)
      {
        if (this.getItem(i) > result) {
          result = this.getItem(i);
        }
      }

      return result === undefined ? null : result;
    },


    /**
     * Returns the lowest value in the array. Supports
     * numeric values only.
     *
     * @return {Number | null} The lowest of all values or undefined
     *   if the array is empty.
     */
    min : function()
    {
      var result = this.getItem(0);

      for (var i = 1; i < this.length; i++)
      {
        if (this.getItem(i) < result) {
          result = this.getItem(i);
        }
      }

      return result === undefined ? null : result;
    },


    /**
     * Invokes the given function for every item in the array.
     *
     * @param callback {Function} The function which will be call for every
     *   item in the array. It will be invoked with three parameters:
     *   the item, the index and the array itself.
     * @param context {var} The context in which the callback will be invoked.
     */
    forEach : function(callback, context)
    {
      for (var i = 0; i < this.__array.length; i++) {
        callback.call(context, this.__array[i], i, this);
      }
    },


    /*
    ---------------------------------------------------------------------------
      Additional JS1.6 methods
    ---------------------------------------------------------------------------
    */
    /**
     * Creates a new array with all elements that pass the test implemented by
     * the provided function. It returns a new data array instance so make sure
     * to think about disposing it.
     * @param callback {Function} The test function, which will be executed for every
     *   item in the array. The function will have three arguments.
     *   <li><code>item</code>: the current item in the array</li>
     *   <li><code>index</code>: the index of the current item</li>
     *   <li><code>array</code>: The native array instance, NOT the data array instance.</li>
     * @param self {var?undefined} The context of the callback.
     * @return {qx.data.Array} A new array instance containing only the items
     *  which passed the test.
     */
    filter : function(callback, self) {
      return new qx.data.Array(this.__array.filter(callback, self));
    },


    /**
     * Creates a new array with the results of calling a provided function on every
     * element in this array. It returns a new data array instance so make sure
     * to think about disposing it.
     * @param callback {Function} The mapping function, which will be executed for every
     *   item in the array. The function will have three arguments.
     *   <li><code>item</code>: the current item in the array</li>
     *   <li><code>index</code>: the index of the current item</li>
     *   <li><code>array</code>: The native array instance, NOT the data array instance.</li>
     * @param self {var?undefined} The context of the callback.
     * @return {qx.data.Array} A new array instance containing the new created items.
     */
    map : function(callback, self) {
      return new qx.data.Array(this.__array.map(callback, self));
    },


    /**
     * Tests whether any element in the array passes the test implemented by the
     * provided function.
     * @param callback {Function} The test function, which will be executed for every
     *   item in the array. The function will have three arguments.
     *   <li><code>item</code>: the current item in the array</li>
     *   <li><code>index</code>: the index of the current item</li>
     *   <li><code>array</code>: The native array instance, NOT the data array instance.</li>
     * @param self {var?undefined} The context of the callback.
     * @return {Boolean} <code>true</code>, if any element passed the test function.
     */
    some : function(callback, self) {
      return this.__array.some(callback, self);
    },


    /**
     * Tests whether every element in the array passes the test implemented by the
     * provided function.
     * @param callback {Function} The test function, which will be executed for every
     *   item in the array. The function will have three arguments.
     *   <li><code>item</code>: the current item in the array</li>
     *   <li><code>index</code>: the index of the current item</li>
     *   <li><code>array</code>: The native array instance, NOT the data array instance.</li>
     * @param self {var?undefined} The context of the callback.
     * @return {Boolean} <code>true</code>, if every element passed the test function.
     */
    every : function(callback, self) {
      return this.__array.every(callback, self);
    },


    /**
     * Apply a function against an accumulator and each value of the array
     * (from left-to-right) as to reduce it to a single value.
     * @param callback {Function} The accumulator function, which will be
     *   executed for every item in the array. The function will have four arguments.
     *   <li><code>previousItem</code>: the previous item</li>
     *   <li><code>currentItem</code>: the current item in the array</li>
     *   <li><code>index</code>: the index of the current item</li>
     *   <li><code>array</code>: The native array instance, NOT the data array instance.</li>
     * @param initValue {var?undefined} Object to use as the first argument to the first
     *   call of the callback.
     * @return {var} The returned value of the last accumulator call.
     */
    reduce : function(callback, initValue) {
      return this.__array.reduce(callback, initValue);
    },


    /**
     * Apply a function against an accumulator and each value of the array
     * (from right-to-left) as to reduce it to a single value.
     * @param callback {Function} The accumulator function, which will be
     *   executed for every item in the array. The function will have four arguments.
     *   <li><code>previousItem</code>: the previous item</li>
     *   <li><code>currentItem</code>: the current item in the array</li>
     *   <li><code>index</code>: the index of the current item</li>
     *   <li><code>array</code>: The native array instance, NOT the data array instance.</li>
     * @param initValue {var?undefined} Object to use as the first argument to the first
     *   call of the callback.
     * @return {var} The returned value of the last accumulator call.
     */
    reduceRight : function(callback, initValue) {
      return this.__array.reduceRight(callback, initValue);
    },


    /*
    ---------------------------------------------------------------------------
      INTERNAL HELPERS
    ---------------------------------------------------------------------------
    */
    /**
     * Internal function which updates the length property of the array.
     * Every time the length will be updated, a {@link #changeLength} data
     * event will be fired.
     */
    __updateLength: function() {
      var oldLength = this.length;
      this.length = this.__array.length;
      this.fireDataEvent("changeLength", this.length, oldLength);
    },


    /**
     * Helper to update the event propagation for a range of items.
     * @param from {Number} Start index.
     * @param to {Number} End index.
     */
    __updateEventPropagation : function(from, to) {
      for (var i=from; i < to; i++) {
        this._registerEventChaining(this.__array[i], this.__array[i], i);
      };
    }
  },



  /*
   *****************************************************************************
      DESTRUCTOR
   *****************************************************************************
  */

  destruct : function() {
    for (var i = 0; i < this.__array.length; i++) {
      var item = this.__array[i];
      this._applyEventPropagation(null, item, i);

      // dispose the items on auto dispose
      if (this.isAutoDisposeItems() && item && item instanceof qx.core.Object) {
        item.dispose();
      }
    }

    this.__array = null;
  }
});
