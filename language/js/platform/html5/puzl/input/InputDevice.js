var INPUT_STATE_UP       = 0; // 00b
var INPUT_STATE_RELEASED = 2; // 10b
var INPUT_STATE_DOWN     = 1; // 01b
var INPUT_STATE_PRESSED  = 3; // 11b

function Input()
{
  this.state = 0;
  this.type  = 0;
  this.id    = 0;
  
  return this;
}

function InputDevice()
{
  this.input;
  this.stateChange;
  
  this.stateChangeBufferSize = 0;
  this.numberOfStateChanges  = 0;
  
  this.lastInputId   = -1;
  this.lastInputType = 0;
  
  this.initialize = function()
  {
    return 0;
  };
  
  this.shutdown = function()
  {
    return 0;
  };
  
  this.check = function( inputId )
  {
    return ( this.input[inputId].state & INPUT_STATE_DOWN ) ? true : false;
  };
  
  this.getState = function( inputId )
  {
    return this.input[inputId].state;
  };
  
  this.setState = function( inputId, state )
  {
    this.input[inputId].state = state;
    if( state == INPUT_STATE_PRESSED )
    {
      this.lastInputId = inputId;
    }
    
    this.stateChange[this.numberOfStateChanges++] = this.input[inputId];
  };
  
  this.getLastInputId = function()
  {
    return this.lastInputId;
  };
  
  this.age = function()
  {
    if( this.numberOfStateChanges > 0 )
    {
      var index;
      for( index = 0; index < this.numberOfStateChanges; index++ )
      {
        var tempStateChange = this.stateChange[index];
        if( tempStateChange.state == INPUT_STATE_RELEASED )
        {
          tempStateChange.state = INPUT_STATE_UP;
        }
        else
        if( tempStateChange.state == INPUT_STATE_PRESSED )
        {
          tempStateChange.state = INPUT_STATE_DOWN;
        }
      }
      
      this.numberOfStateChanges = 0;
      this.lastInputId          = -1;
    }
  };
  
  return this;
}