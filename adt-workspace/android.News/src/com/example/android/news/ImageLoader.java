package com.example.android.news;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Collections;
import java.util.Map;
import java.util.WeakHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Handler;
import android.view.View;
import android.widget.ImageView;

public class ImageLoader {
    
    // Initialize MemoryCache
    private MemoryCache memoryCache = new MemoryCache();
     
    private FileCache fileCache;
     
    //Create Map (collection) to store image and image url in key value pair
    private Map<ImageView, String> imageViews = Collections.synchronizedMap(new WeakHashMap<ImageView, String>());
    private ExecutorService executorService;
     
    //handler to display images in UI thread
    private Handler handler = new Handler();
     
    public ImageLoader(Context context){
         
        fileCache = new FileCache(context);
         
        // Creates a thread pool that reuses a fixed number of
        // threads operating off a shared unbounded queue.
        executorService = Executors.newFixedThreadPool(1);
         
    }
     
    public void displayImage(String url, ImageView imageView) {
        //Store image and url in Map
    	// XXX
    	if (!imageViews.containsKey(imageView)) {
    		imageViews.put(imageView, url);
    	}
    	
        //Check image is stored in MemoryCache Map or not (see MemoryCache.java)
        Bitmap bitmap = memoryCache.get(url);
         
        if (bitmap != null) {
            // if image is stored in MemoryCache Map then
            // Show image in listview row
            imageView.setImageBitmap(bitmap);
            imageView.setVisibility(View.VISIBLE);
        } else {
            //queue Photo to download from url
            queuePhoto(url, imageView);
        }
    }
         
    private void queuePhoto(String url, ImageView imageView) {
        // Store image and url in PhotoToLoad object
    	ImageToLoad imageToLoad= new ImageToLoad(url, imageView);
         
        // pass PhotoToLoad object to PhotosLoader runnable class
        // and submit PhotosLoader runnable to executers to run
        executorService.submit(new PhotosLoader(imageToLoad));
    }
     
    //Task for the queue
    private class ImageToLoad {
        public String URL;
        public ImageView imageView;
        
        public ImageToLoad(String URL, ImageView imageView) {
            this.URL = URL;
            this.imageView = imageView;
        }
    }
     
    class PhotosLoader implements Runnable {
    	ImageToLoad imageToLoad;
         
        PhotosLoader(ImageToLoad imageToLoad){
            this.imageToLoad = imageToLoad;
        }
         
        @Override
        public void run() {
            try{                
            	// check cache for image else download image from web url and cache
                Bitmap bmp = memoryCache.get(imageToLoad.URL);
                if (bmp == null) {

                	bmp = getBitmap(imageToLoad.URL);
                    memoryCache.put(imageToLoad.URL, bmp);
                }

                // Create and run mitmap display runnable on UI thred
                BitmapDisplayer bd = new BitmapDisplayer(bmp, imageToLoad);
                handler.post(bd);
                 
            }catch(Throwable th){
                th.printStackTrace();
            }
        }
    }
     
    private Bitmap getBitmap(String url) {
        File file = fileCache.getFile(url);
         
        // from SD cache
        if (file.exists()) {
        	Bitmap bitmap = decodeFile(file);
        	if (bitmap != null)
            return bitmap;
        }
        
        // Download image file from web
        try {
            URL imageUrl = new URL(url);
            HttpURLConnection conn = (HttpURLConnection)imageUrl.openConnection();
            conn.setConnectTimeout(30000);
            conn.setReadTimeout(30000);
            conn.setInstanceFollowRedirects(true);
            InputStream is = conn.getInputStream();
             
            OutputStream os = new FileOutputStream(file);
             
            // Copy content from input to output stream
            try {
                byte[] bytes = new byte[1024];
                int bytesRead = 0;
                
                while ((bytesRead = is.read(bytes)) != -1) {
                  os.write(bytes, 0, bytesRead);
                }
            }
            catch(Exception ex){}
             
            os.close();
            conn.disconnect();
             
            // Now file created and going to resize file with defined height
            // Decodes image and scales it to reduce memory consumption
            return decodeFile(file);
             
        } catch (Throwable ex){
           ex.printStackTrace();
           if(ex instanceof OutOfMemoryError)
               memoryCache.clear();
           return null;
        }
    }
 
    //Decodes image and scales it to reduce memory consumption
    private Bitmap decodeFile(File file){
         
        try {
            //Decode image size
            BitmapFactory.Options o = new BitmapFactory.Options();
            o.inJustDecodeBounds = true;
            FileInputStream stream1=new FileInputStream(file);
            BitmapFactory.decodeStream(stream1, null, o);
            stream1.close();
            
            // Find the correct scale value. It should be the power of 2.
            // Set width/height of recreated image
            final int REQUIRED_SIZE = 120;
             
            int width_tmp = o.outWidth, height_tmp = o.outHeight;
            int scale = 1;
            while (true) {
                if(width_tmp/2 < REQUIRED_SIZE || height_tmp/2 < REQUIRED_SIZE)
                    break;
                width_tmp /= 2;
                height_tmp /= 2;
                scale *= 2;
            }
             
            //decode with current scale values
            BitmapFactory.Options o2 = new BitmapFactory.Options();
            o2.inSampleSize = scale;
            FileInputStream stream2 = new FileInputStream(file);
            Bitmap bitmap = BitmapFactory.decodeStream(stream2, null, o2);
            stream2.close();
            return bitmap;
        } catch (FileNotFoundException e) {
        } catch (IOException e) {
            e.printStackTrace();
        }
        return null;
    }
     
    //Used to display bitmap in the UI thread
    class BitmapDisplayer implements Runnable {
        private Bitmap bitmap;
        private ImageToLoad imageToLoad;
        public BitmapDisplayer(Bitmap bitmap, ImageToLoad imageToLoad) {
        	this.bitmap = bitmap;
        	this.imageToLoad = imageToLoad;
        }
        
        public void run() {
            // Show bitmap on UI
            if (bitmap != null) {
            	imageToLoad.imageView.setImageBitmap(bitmap);
            	imageToLoad.imageView.setVisibility(View.VISIBLE);
            }
        }
    }
 
    public void clearCache() {
        //Clear cache directory downloaded images and stored data in maps
        memoryCache.clear();
        fileCache.clear();
    }
 
}
