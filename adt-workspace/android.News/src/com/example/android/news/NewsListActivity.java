package com.example.android.news;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.SortedSet;
import java.util.TreeSet;

import org.json.JSONArray;
import org.json.JSONObject;

import android.content.Context;
import android.content.Intent;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.AsyncTask;
import android.os.Bundle;
import android.support.v7.app.ActionBarActivity;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.view.Window;
import android.widget.ListView;

public class NewsListActivity extends ActionBarActivity {
	public static final String JSON_URL = "http://mobilatr.mob.f2.com.au/services/views/9.json";
	public static final String TINY_URL = "com.westpac.news.TinyURL";
    
    private boolean refreshVisible = false;
    private ListView listView;
    private LazyImageLoadAdapter listAdapter;
    private SortedSet<NewsItem> newsItems;
    
	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		
		// Support ActionBar progress indicator on rev. 7+
		supportRequestWindowFeature(Window.FEATURE_PROGRESS);
		supportRequestWindowFeature(Window.FEATURE_INDETERMINATE_PROGRESS);
		
		setContentView(R.layout.activity_news_list);
		
		newsItems = new TreeSet<NewsItem>();
		
		listView = (ListView)findViewById(R.id.newsList);
		
		loadStream();
	}
	
	@Override
	public void onDestroy() {
		listView.setAdapter(null);
		super.onDestroy();
	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		getMenuInflater().inflate(R.menu.news_list, menu);
		
		MenuItem item = menu.findItem(R.id.action_refresh);
		item.setVisible(refreshVisible);
		
		return super.onCreateOptionsMenu(menu);
	}
	
	@Override
	public boolean onOptionsItemSelected(MenuItem item) {
		switch(item.getItemId()) {
		case R.id.action_refresh:
			loadStream();
			return true;
		default:
			return super.onOptionsItemSelected(item);
		}
	}
	
	private void setRefreshVisible(boolean visible) {
		refreshVisible = visible;
		supportInvalidateOptionsMenu();
	}
	
	private void loadStream() {
		// Update progress and refresh action visibility
		setRefreshVisible(false);
		setSupportProgressBarIndeterminate(true);
		setSupportProgressBarIndeterminateVisibility(true);
		
		newsItems.clear();
		
		// If network is available begin download of JSON stream
        ConnectivityManager connMgr = (ConnectivityManager) 
        getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo networkInfo = connMgr.getActiveNetworkInfo();
        if (networkInfo != null && networkInfo.isConnected()) {
            new DownloadWebpageTask().execute(JSON_URL);
        } else {
        	Log.e(getClass().getName(), "Network not available");
        }
	}
	
	private void populateListView() {
		listAdapter = new LazyImageLoadAdapter(this, new ArrayList<NewsItem>(newsItems));
		listView.setAdapter(listAdapter);
	}
	
	public void showWebView(String URL) {
		// Show the WebView for a given URL
		Intent intent = new Intent(this, WebViewActivity.class);
		intent.putExtra(TINY_URL, URL);
		
		startActivity(intent);
	}

	private class DownloadWebpageTask extends AsyncTask<String, Void, String> {
		@Override
		protected String doInBackground(String... urls) {      
			try {
				return fetchURLContent(urls[0]);
			} catch (IOException e) {
				String message = "Could not retreive URL content: " +e.getMessage();
				Log.e(getClass().getName(), message);
				return message;
			}
		}

		// onPostExecute displays the results of the AsyncTask.
		@Override
		protected void onPostExecute(String result) {
			// Parse JSON stream and create NewsItem from relevant fields
			try {
				JSONObject jsonObject = new JSONObject(result);
				
				JSONArray jsonArray = jsonObject.getJSONArray("items");
				Log.i(getClass().getName(), "Number of entries " + jsonArray.length());
				
				for (int i = 0; i < jsonArray.length(); i++) {
					jsonObject = jsonArray.getJSONObject(i);					

					NewsItem item = new NewsItem();
					item.setId(jsonObject.getString("identifier"));
					item.setHeadLine(jsonObject.getString("headLine"));
					item.setSlugLine(jsonObject.getString("slugLine"));
					item.setDateLine(jsonObject.getString("dateLine"));
					String href = jsonObject.getString("thumbnailImageHref");
					if (href.length() > 0 && !"null".equals(href))
						item.setImageURI(href);
					item.setTinyURL(jsonObject.getString("tinyUrl"));
					newsItems.add(item);
				}
			} catch (Exception e) {
				e.printStackTrace();
			} finally {
				populateListView();
		        setSupportProgressBarIndeterminateVisibility(false);
		        setRefreshVisible(true);
			}
		}
		
		private String fetchURLContent(String URL) throws IOException {
		    InputStream is = null;
		    // Open GET connection to url and return content 
		    try {
		        URL url = new URL(URL);
		        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
		        conn.setReadTimeout(10000);
		        conn.setConnectTimeout(15000);
		        conn.setRequestMethod("GET");
		        conn.setDoInput(true);
		        
		        conn.connect();
		        int response = conn.getResponseCode();
		        Log.d(getClass().getName(), "HTTP response is: " + response);
		        is = conn.getInputStream();

		        return readStream(is);		        
		    } finally {
		        if (is != null) {
		            is.close();
		        } 
		    }
		}
		
		private String readStream(InputStream stream) throws IOException, UnsupportedEncodingException {
		    // Read from input to string buffer and return
			Reader reader = new InputStreamReader(stream, "UTF-8");
		    StringBuilder buffer = new StringBuilder();
		    
		    int charsRead = 0;
		    char[] chars = new char[1024];
		    while ((charsRead = reader.read(chars)) != -1) {
		    	buffer.append(chars, 0, charsRead);
		    }
		   
		    return buffer.toString();
		}
	}
}
