package com.example.android.news;

import java.util.List;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.View.OnClickListener;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.ImageView;
import android.widget.TextView;

public class LazyImageLoadAdapter extends BaseAdapter {

	private NewsListActivity activity;
	private List<NewsItem> model;
	private static LayoutInflater inflater = null;
	public ImageLoader imageLoader;

	public LazyImageLoadAdapter(NewsListActivity activity, List<NewsItem> model) {
		this.activity = activity;
		this.model = model;
		inflater = (LayoutInflater)activity.getSystemService(Context.LAYOUT_INFLATER_SERVICE);

		// Create ImageLoader object to download and show image in list
		imageLoader = new ImageLoader(activity.getApplicationContext());
	}

	public int getCount() {
		return model.size();
	}

	public NewsItem getItem(int position) {
		return model.get(position);
	}

	public long getItemId(int position) {
		return position;
	}

	public static class ViewHolder {
		public TextView headLine;
		public TextView slugLine;
		public ImageView thumbnail;
	}

	@Override
	public View getView(int position, View convertView, ViewGroup parent) {

		View view = convertView;
		ViewHolder holder;

		// Created new view holder or extract holder from exiting view
		if (convertView == null) {
			view = inflater.inflate(R.layout.row_layout, null);

			holder = new ViewHolder();
			holder.headLine = (TextView) view.findViewById(R.id.headLineText);
			holder.slugLine = (TextView) view.findViewById(R.id.slugLineText);
			holder.thumbnail = (ImageView) view.findViewById(R.id.thumbnailImage);

			view.setTag(holder);
		} else {
			holder = (ViewHolder)view.getTag();
		}

		// Update view data from NewsItem
		NewsItem item = model.get(position);
		holder.headLine.setText(item.getHeadLine());
		holder.slugLine.setText(item.getSlugLine());
		ImageView imageView = holder.thumbnail;

		// Hide image and start image loader
		// loader will display image once loaded
		imageView.setVisibility(View.GONE);
		if (item.hasImageURI()) {
			imageLoader.displayImage(item.getImageURI(), imageView);
		} else {
			imageView.setImageBitmap(null);
		}

		// add ro click listener to view
		view.setOnClickListener(new OnItemClickListener(position));
		return view;
	}

	// Row click listener to load WebView
	private class OnItemClickListener implements OnClickListener {
		private int position;

		public OnItemClickListener(int position) {
			this.position = position;
		}

		@Override
		public void onClick(View view) {
			activity.showWebView(model.get(position).getTinyURL());
		}
	}
}