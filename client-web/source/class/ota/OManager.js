/* ************************************************************************


************************************************************************ */

/**
 * Object Manager
 *
 * Basic take on DI service. Just an Object directory - no real object
 * life cyle. 
 * 
 * Looked a few generic options but they were more than what I need (and
 * things never work that well with qx anyway).
 * 
 */
qx.Class.define("ota.OManager",
{
  extend : qx.core.Object,

  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function()
  {
    this.base(arguments);

    this.__directory = {};
  },

  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
  },

  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /** @type {Map} Stores managed objects */
    __directory : null,

    add : function(name, obj)
    {
      if (!obj) {
        throw new Error("object needs to be defined!");
      }
      if (!name) {
        throw new Error("name needs to be defined!");
      }
      if (this.__directory[name]) {
        throw new Error("object name already defined : " + name);
      }
      this.__directory[name] = obj;
      return obj;
    },

    get : function(name)
    {
      if (!name) {
        throw new Error("name needs to be defined!");
      }
      if (!this.__directory[name]) {
        throw new Error("object name does not exist : " + name); // should I throw an error or just return null ??
      }
      return this.__directory[name];
    },

    clear : function(name)
    {
      if (!name) {
        throw new Error("name needs to be defined!");
      }
      if (!this.__directory[name]) {
        throw new Error("object name does not exist : " + name); // should I throw an error or just return null ??
      }
      delete this.__directory[name];      
    },

    destroy : function(name)
    {
      if (!name) {
        throw new Error("name needs to be defined!");
      }
      if (!this.__directory[name]) {
        throw new Error("object name does not exist : " + name); // should I throw an error or just return null ??
      }
      this.__directory[name].destroy();   
      delete this.__directory[name];      
    }
  },

  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    this._disposeMap('__directory');
  }
});
