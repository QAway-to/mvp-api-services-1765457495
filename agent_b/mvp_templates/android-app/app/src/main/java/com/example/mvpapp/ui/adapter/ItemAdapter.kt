package com.example.mvpapp.ui.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.mvpapp.data.model.DataItem
import com.example.mvpapp.databinding.ItemDataBinding
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class ItemAdapter(
    private val onItemClick: (DataItem) -> Unit
) : ListAdapter<DataItem, ItemAdapter.ItemViewHolder>(DiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ItemViewHolder {
        val binding = ItemDataBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return ItemViewHolder(binding, onItemClick)
    }

    override fun onBindViewHolder(holder: ItemViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class ItemViewHolder(
        private val binding: ItemDataBinding,
        private val onItemClick: (DataItem) -> Unit
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(item: DataItem) {
            binding.apply {
                titleText.text = item.title
                descriptionText.text = item.description
                timestampText.text = formatTimestamp(item.timestamp)
                
                root.setOnClickListener {
                    onItemClick(item)
                }
            }
        }

        private fun formatTimestamp(timestamp: Long): String {
            val sdf = SimpleDateFormat("dd MMM yyyy, HH:mm", Locale.getDefault())
            return sdf.format(Date(timestamp))
        }
    }

    class DiffCallback : DiffUtil.ItemCallback<DataItem>() {
        override fun areItemsTheSame(oldItem: DataItem, newItem: DataItem): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: DataItem, newItem: DataItem): Boolean {
            return oldItem == newItem
        }
    }
}

