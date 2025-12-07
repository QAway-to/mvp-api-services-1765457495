package com.example.mvpapp.ui.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.mvpapp.data.model.DataItem
import com.example.mvpapp.data.repository.DataRepository
import kotlinx.coroutines.launch

class MainViewModel : ViewModel() {

    private val repository = DataRepository()

    private val _items = MutableLiveData<List<DataItem>>()
    val items: LiveData<List<DataItem>> = _items

    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading

    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error

    init {
        loadData()
    }

    fun loadData() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            try {
                val data = repository.getItems()
                _items.value = data
            } catch (e: Exception) {
                _error.value = e.message ?: "Unknown error"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun refreshData() {
        loadData()
    }

    fun addNewItem() {
        viewModelScope.launch {
            try {
                val newItem = DataItem(
                    id = System.currentTimeMillis().toString(),
                    title = "New Item ${_items.value?.size ?: 0 + 1}",
                    description = "This is a new item",
                    timestamp = System.currentTimeMillis()
                )
                val currentList = _items.value?.toMutableList() ?: mutableListOf()
                currentList.add(0, newItem)
                _items.value = currentList
            } catch (e: Exception) {
                _error.value = e.message ?: "Failed to add item"
            }
        }
    }
}

