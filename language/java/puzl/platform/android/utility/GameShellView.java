/*
 * Copyright (C) 2009 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package puzl.platform.android.utility;
/*
 * Copyright (C) 2008 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

//import com.htc.view.DisplaySetting;

import java.nio.IntBuffer;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.PixelFormat;
import android.opengl.GLSurfaceView;
import android.opengl.GLUtils;
import android.util.Log;
import android.view.MotionEvent;
import android.view.SurfaceHolder;

import javax.microedition.khronos.egl.EGL10;
import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.egl.EGLContext;
import javax.microedition.khronos.egl.EGLDisplay;
import javax.microedition.khronos.opengles.GL10;


/**
 * A simple GLSurfaceView sub-class that demonstrate how to perform
 * OpenGL ES 2.0 rendering into a GL Surface. Note the following important
 * details:
 *
 * - The class must use a custom context factory to enable 2.0 rendering.
 *   See ContextFactory class definition below.
 *
 * - The class must use a custom EGLConfigChooser to be able to select
 *   an EGLConfig that supports 2.0. This is done by providing a config
 *   specification to eglChooseConfig() that has the attribute
 *   EGL10.ELG_RENDERABLE_TYPE containing the EGL_OPENGL_ES2_BIT flag
 *   set. See ConfigChooser class definition below.
 *
 * - The class must select the surface's format, then choose an EGLConfig
 *   that matches it exactly (with regards to red/green/blue/alpha channels
 *   bit depths). Failure to do so would result in an EGL_BAD_MATCH error.
 */
class GameShellView extends GLSurfaceView
{
  private static String TAG = "GameShellView";
  private static final boolean DEBUG = false;
  
  private GameShell gameShell;
  private SurfaceHolder surfaceHolder;
  public GameShellRenderer gameShellRenderer;
  
  private ContextFactory contextFactory;

  public GameShellView( GameShell gameShellActivity )
  {
    super( gameShellActivity.getApplication() );
    
    surfaceHolder = getHolder();
    surfaceHolder.addCallback( this );
    
    this.gameShell = gameShellActivity;
    
    initialize( false, 0, 0 );
  }

  public GameShellView( Context context, boolean translucent, int depth, int stencil )
  {
    super( context );
    initialize( translucent, depth, stencil );
  }

  private void initialize( boolean translucent, int depth, int stencil )
  {
    /* By default, GLSurfaceView() creates a RGB_565 opaque surface.
     * If we want a translucent one, we should change the surface's
     * format here, using PixelFormat.TRANSLUCENT for GL Surfaces
     * is interpreted as any 32-bit surface with alpha by SurfaceFlinger.
     */
    if( translucent )
    {
      //this.getHolder().setFormat( PixelFormat.TRANSLUCENT );
      surfaceHolder.setFormat( PixelFormat.TRANSLUCENT );
    }
  
    contextFactory = new ContextFactory();
    setEGLContextFactory( contextFactory );
  
    /* We need to choose an EGLConfig that matches the format of
     * our surface exactly. This is going to be done in our
     * custom config chooser. See ConfigChooser class definition
     * below.
     */
    setEGLConfigChooser( translucent ?
                         new ConfigChooser( 8, 8, 8, 8, depth, stencil ) :
                         new ConfigChooser( 5, 6, 5, 0, depth, stencil ) );
  
    // Set the renderer responsible for frame rendering.
    gameShellRenderer = new GameShellRenderer( gameShell, this );
    setRenderer( gameShellRenderer );
    
    setRenderMode( GLSurfaceView.RENDERMODE_WHEN_DIRTY );
  }

  private static class ContextFactory implements GLSurfaceView.EGLContextFactory
  {
    private static int EGL_CONTEXT_CLIENT_VERSION = 0x3098;
    public EGLContext createContext( EGL10 egl, EGLDisplay display, EGLConfig eglConfig )
    {
      //Log.w(TAG, "BEGIN: creating OpenGL ES 2.0 context");
      //checkEglError( "Before eglCreateContext", egl );
      
      int[] attributeList = {EGL_CONTEXT_CLIENT_VERSION, 1, EGL10.EGL_NONE};
      EGLContext context = egl.eglCreateContext( display, eglConfig, EGL10.EGL_NO_CONTEXT, attributeList );
      
      //checkEglError( "After eglCreateContext", egl );
      //Log.w(TAG, "END: creating OpenGL ES 2.0 context");
      
      return context;
    }
  
    public void destroyContext( EGL10 egl, EGLDisplay display, EGLContext context )
    {
      egl.eglDestroyContext( display, context );
    }
  }

  /*private static void checkEglError( String prompt, EGL10 egl )
  {
    int error;
    while( ( error = egl.eglGetError() ) != EGL10.EGL_SUCCESS )
    {
      Log.e( TAG, String.format( "%s: EGL error: 0x%x", prompt, error ) );
    }
  }*/

  private static class ConfigChooser implements GLSurfaceView.EGLConfigChooser
  {
    public ConfigChooser( int r, int g, int b, int a, int depth, int stencil )
    {
      mRedSize = r;
      mGreenSize = g;
      mBlueSize = b;
      mAlphaSize = a;
      mDepthSize = depth;
      mStencilSize = stencil;
    }

    // This EGL config specification is used to specify 2.0 rendering.
    // We use a minimum size of 4 bits for red/green/blue, but will
    // perform actual matching in chooseConfig() below.
    private static int   EGL_OPENGL_ES2_BIT = 4;
    private static int[] s_configAttribs2 =
    {
      EGL10.EGL_RED_SIZE,        4,
      EGL10.EGL_GREEN_SIZE,      4,
      EGL10.EGL_BLUE_SIZE,       4,
      EGL10.EGL_RENDERABLE_TYPE, EGL_OPENGL_ES2_BIT,
      EGL10.EGL_NONE
    };

    public EGLConfig chooseConfig( EGL10 egl, EGLDisplay display )
    {
      // Get the number of minimally matching EGL configurations
      int[] num_config = new int[1];
      egl.eglChooseConfig( display, s_configAttribs2, null, 0, num_config );
  
      int numConfigs = num_config[0];
      if( numConfigs <= 0 )
      {
        throw new IllegalArgumentException( "No configs match configSpec" );
      }
  
      // Allocate then read the array of minimally matching EGL configs
      EGLConfig[] configs = new EGLConfig[numConfigs];
      egl.eglChooseConfig( display, s_configAttribs2, configs, numConfigs, num_config );
  
      if( DEBUG )
      {
        printConfigs( egl, display, configs );
      }
      
      // Now return the "best" one
      return chooseConfig( egl, display, configs );
    }

    public EGLConfig chooseConfig( EGL10 egl, EGLDisplay display, EGLConfig[] configs )
    {
      for( EGLConfig config : configs )
      {
          int d = findConfigAttrib( egl, display, config, EGL10.EGL_DEPTH_SIZE, 0 );
          int s = findConfigAttrib( egl, display, config, EGL10.EGL_STENCIL_SIZE, 0 );
  
          // We need at least mDepthSize and mStencilSize bits
          if( d < mDepthSize || s < mStencilSize )
          {
            continue;
          }
  
          // We want an *exact* match for red/green/blue/alpha
          int r = findConfigAttrib( egl, display, config, EGL10.EGL_RED_SIZE,   0 );
          int g = findConfigAttrib( egl, display, config, EGL10.EGL_GREEN_SIZE, 0 );
          int b = findConfigAttrib( egl, display, config, EGL10.EGL_BLUE_SIZE,  0 );
          int a = findConfigAttrib( egl, display, config, EGL10.EGL_ALPHA_SIZE, 0 );
  
          if( r == mRedSize   &&
              g == mGreenSize &&
              b == mBlueSize  &&
              a == mAlphaSize )
          {
            return config;
          }
      }
      return null;
    }

    private int findConfigAttrib( EGL10 egl, EGLDisplay display, EGLConfig config,
                                  int attribute, int defaultValue )
    {
      if( egl.eglGetConfigAttrib( display, config, attribute, mValue ) )
      {
        return mValue[0];
      }
      
      return defaultValue;
    }

    private void printConfigs( EGL10 egl, EGLDisplay display, EGLConfig[] configs )
    {
      int numConfigs = configs.length;
      Log.w( TAG, String.format( "%d configurations", numConfigs ) );
      for( int i = 0; i < numConfigs; i++ )
      {
        Log.w( TAG, String.format( "Configuration %d:\n", i ) );
        printConfig( egl, display, configs[i] );
      }
    }

    private void printConfig( EGL10 egl, EGLDisplay display, EGLConfig config )
    {
      int[] attributes =
      {
        EGL10.EGL_BUFFER_SIZE,
        EGL10.EGL_ALPHA_SIZE,
        EGL10.EGL_BLUE_SIZE,
        EGL10.EGL_GREEN_SIZE,
        EGL10.EGL_RED_SIZE,
        EGL10.EGL_DEPTH_SIZE,
        EGL10.EGL_STENCIL_SIZE,
        EGL10.EGL_CONFIG_CAVEAT,
        EGL10.EGL_CONFIG_ID,
        EGL10.EGL_LEVEL,
        EGL10.EGL_MAX_PBUFFER_HEIGHT,
        EGL10.EGL_MAX_PBUFFER_PIXELS,
        EGL10.EGL_MAX_PBUFFER_WIDTH,
        EGL10.EGL_NATIVE_RENDERABLE,
        EGL10.EGL_NATIVE_VISUAL_ID,
        EGL10.EGL_NATIVE_VISUAL_TYPE,
        0x3030, // EGL10.EGL_PRESERVED_RESOURCES,
        EGL10.EGL_SAMPLES,
        EGL10.EGL_SAMPLE_BUFFERS,
        EGL10.EGL_SURFACE_TYPE,
        EGL10.EGL_TRANSPARENT_TYPE,
        EGL10.EGL_TRANSPARENT_RED_VALUE,
        EGL10.EGL_TRANSPARENT_GREEN_VALUE,
        EGL10.EGL_TRANSPARENT_BLUE_VALUE,
        0x3039, // EGL10.EGL_BIND_TO_TEXTURE_RGB,
        0x303A, // EGL10.EGL_BIND_TO_TEXTURE_RGBA,
        0x303B, // EGL10.EGL_MIN_SWAP_INTERVAL,
        0x303C, // EGL10.EGL_MAX_SWAP_INTERVAL,
        EGL10.EGL_LUMINANCE_SIZE,
        EGL10.EGL_ALPHA_MASK_SIZE,
        EGL10.EGL_COLOR_BUFFER_TYPE,
        EGL10.EGL_RENDERABLE_TYPE,
        0x3042 // EGL10.EGL_CONFORMANT
      };
      
      String[] names =
      {
        "EGL_BUFFER_SIZE",
        "EGL_ALPHA_SIZE",
        "EGL_BLUE_SIZE",
        "EGL_GREEN_SIZE",
        "EGL_RED_SIZE",
        "EGL_DEPTH_SIZE",
        "EGL_STENCIL_SIZE",
        "EGL_CONFIG_CAVEAT",
        "EGL_CONFIG_ID",
        "EGL_LEVEL",
        "EGL_MAX_PBUFFER_HEIGHT",
        "EGL_MAX_PBUFFER_PIXELS",
        "EGL_MAX_PBUFFER_WIDTH",
        "EGL_NATIVE_RENDERABLE",
        "EGL_NATIVE_VISUAL_ID",
        "EGL_NATIVE_VISUAL_TYPE",
        "EGL_PRESERVED_RESOURCES",
        "EGL_SAMPLES",
        "EGL_SAMPLE_BUFFERS",
        "EGL_SURFACE_TYPE",
        "EGL_TRANSPARENT_TYPE",
        "EGL_TRANSPARENT_RED_VALUE",
        "EGL_TRANSPARENT_GREEN_VALUE",
        "EGL_TRANSPARENT_BLUE_VALUE",
        "EGL_BIND_TO_TEXTURE_RGB",
        "EGL_BIND_TO_TEXTURE_RGBA",
        "EGL_MIN_SWAP_INTERVAL",
        "EGL_MAX_SWAP_INTERVAL",
        "EGL_LUMINANCE_SIZE",
        "EGL_ALPHA_MASK_SIZE",
        "EGL_COLOR_BUFFER_TYPE",
        "EGL_RENDERABLE_TYPE",
        "EGL_CONFORMANT"
      };
      
      int[] value = new int[1];
      for( int i = 0; i < attributes.length; i++ )
      {
        int attribute = attributes[i];
        String name = names[i];
        if( egl.eglGetConfigAttrib( display, config, attribute, value ) )
        {
          Log.w( TAG, String.format( "  %s: %d\n", name, value[0] ) );
        }
        else
        {
          while( egl.eglGetError() != EGL10.EGL_SUCCESS );
        }
      }
    }

    // Subclasses can adjust these values:
    protected int mRedSize;
    protected int mGreenSize;
    protected int mBlueSize;
    protected int mAlphaSize;
    protected int mDepthSize;
    protected int mStencilSize;
    private int[] mValue = new int[1];
  }
  
  /*@Override
  public void onPause()
  {
    enableStereoScopic( false );
  }
  
  public boolean enableStereoScopic( boolean enable )
  {
    int mode;
    if( enable )
    {
      mode = DisplaySetting.STEREOSCOPIC_3D_FORMAT_SIDE_BY_SIDE;
    }
    else
    {
      mode = DisplaySetting.STEREOSCOPIC_3D_FORMAT_OFF;
    }
    
    return DisplaySetting.setStereoscopic3DFormat( surfaceHolder.getSurface(), mode );
  }*/
  
  @Override
  public boolean onTouchEvent( final MotionEvent event )
  {
    // Don't allow more than 60 motion events per second.
    /*try
    {
      Thread.sleep( 16 );
    }
    catch( InterruptedException e )
    {
      
    }*/
    
    final int action = event.getAction();
    if( action == MotionEvent.ACTION_DOWN )
    {
      queueEvent( new Runnable()
                  {
                    public void run()
                    { 
                      gameShell.touchDown( 0, ( int )event.getX(), ( int )event.getY() );
                    }
                  }
      );
    }
    else
    if( action == MotionEvent.ACTION_MOVE )
    {
      queueEvent( new Runnable()
                  {
                    public void run()
                    {
                      gameShell.touchMove( 0, ( int )event.getX(), ( int )event.getY() );
                    }
                  }
      );
    }
    else
    if( action == MotionEvent.ACTION_UP )
    {
      queueEvent( new Runnable()
                  {
                    public void run()
                    {
                      gameShell.touchUp( 0, ( int )event.getX(), ( int )event.getY() );
                    }
                  }
      );
    }
    
    //gameShellRenderer.waitDrawingComplete();

    return true;
  }

  static class GameShellRenderer implements GLSurfaceView.Renderer
  {
    private GameShell gameShellActivity;
    
    private GameShellView gameShellView;
    
    private boolean updateDisplay;
    private Object drawLock;
    
    private GL10 gl;
    IntBuffer texturesBuffer;
    
    public GameShellRenderer( GameShell gameShellActivity, GameShellView gameShellView )
    {
      this.gameShellActivity = gameShellActivity;
      this.gameShellView     = gameShellView;
      
      updateDisplay = true;
      drawLock = new Object();
    }
    
    public void onDrawFrame( GL10 gl )
    {
      //Log.i( "puzl", "GameShellRenderer.onDrawFrame(): " + SystemClock.uptimeMillis() );
      synchronized( drawLock )
      {
        while( !updateDisplay )
        {
          try
          {
            drawLock.wait();
          }
          catch( InterruptedException e )
          {
            // No big deal if this wait is interrupted.
          }
        }
        
        synchronized( this )
        {
          //Log.i( "puzl", "GameShellRenderer.onDrawFrame(): preparing to draw" + SystemClock.uptimeMillis() );
          gameShellActivity.onDrawFrame();
          //Log.i( "puzl", "GameShellRenderer.onDrawFrame(): finishing drawing" + SystemClock.uptimeMillis() );
          
          this.notify();
        }
          
        updateDisplay = false;
        drawLock.notify();
      }
    }
  
    public void onSurfaceChanged( GL10 gl, int width, int height )
    {
      Log.v( "puzl", String.format( "GameShellView.Renderer.onSurfaceChanged(): %s %s\n", width, height ) );
      
      this.gl = gl;
      GameShell._gameShellView = gameShellView;
      
      /*if( !gameShellView.enableStereoScopic( true ) )
      {
        gameShellView.enableStereoScopic( false );
      }*/
          
      gameShellActivity.initializeVideo( width, height );
    }
  
    public void onSurfaceCreated( GL10 gl, EGLConfig config )
    {
      Log.v( "puzl", String.format( "GameShellView.Renderer.onSurfaceCreated()" ) );
      
      this.gl = gl;
      GameShell._gameShellView = gameShellView;
    }
    
    public synchronized void setDrawReady()
    {
      synchronized( drawLock )
      {
        updateDisplay = true;
        drawLock.notify();
      }
    }
    
    public void waitDrawingComplete()
    {
      synchronized( drawLock )
      {
        while( updateDisplay )
        {
          try
          {
            drawLock.wait();
          }
          catch( InterruptedException e )
          {
            // No big deal if this wait is interrupted.
          }
        }

        drawLock.notify();
      }
    }
    
    int loadTextureFromBitmap( Bitmap bitmap )
    {
      //Log.v( "puzl", String.format( "GameShellView.Renderer.loadTextureFromBitmap()" ) );
      
      // Generate one texture pointer...
      texturesBuffer = IntBuffer.allocate( 1 );
      gl.glGenTextures( 1, texturesBuffer );
      
      // ...and bind it to our array.
      gl.glBindTexture( GL10.GL_TEXTURE_2D, texturesBuffer.get( 0 ) );
        
      // Create Nearest Filtered Texture.
      gl.glTexParameterf( GL10.GL_TEXTURE_2D, GL10.GL_TEXTURE_MIN_FILTER, GL10.GL_NEAREST );
      gl.glTexParameterf( GL10.GL_TEXTURE_2D, GL10.GL_TEXTURE_MAG_FILTER, GL10.GL_NEAREST );
      
      // Different possible texture parameters, e.g. GL10.GL_CLAMP_TO_EDGE.
      gl.glTexParameterf( GL10.GL_TEXTURE_2D, GL10.GL_TEXTURE_WRAP_S, GL10.GL_REPEAT );
      gl.glTexParameterf( GL10.GL_TEXTURE_2D, GL10.GL_TEXTURE_WRAP_T, GL10.GL_REPEAT );
        
      // Use the Android GLUtils to specify a two-dimensional texture image from our bitmap.
      GLUtils.texImage2D( GL10.GL_TEXTURE_2D, 0, bitmap, 0 );
      
      return texturesBuffer.get( 0 );
    }
  }
}
