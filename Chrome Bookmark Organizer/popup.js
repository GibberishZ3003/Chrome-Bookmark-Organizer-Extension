document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('sortByDate').addEventListener('click', sortBookmarksByDate);
  document.getElementById('sortByName').addEventListener('click', sortBookmarksByName);
  document.getElementById('sortByLastUsed').addEventListener('click', sortBookmarksByLastUsed);
  document.getElementById('sortByFrequency').addEventListener('click', sortBookmarksByFrequency);
});

let bookmarkFrequencies = {}; // Object to store bookmark frequencies

function sortBookmarksByDate() {
  chrome.bookmarks.create({ title: 'Sorted Bookmarks' }, function(newFolder) {
    sortAndSaveBookmarks(newFolder.id, 'dateAdded');
  });
}

function sortBookmarksByName() {
  chrome.bookmarks.create({ title: 'Sorted Bookmarks' }, function(newFolder) {
    sortAndSaveBookmarks(newFolder.id, 'title');
  });
}

function sortBookmarksByLastUsed() {
  chrome.bookmarks.create({ title: 'Sorted Bookmarks' }, function(newFolder) {
    sortAndSaveBookmarks(newFolder.id, 'lastVisitTime');
  });
}

function sortBookmarksByFrequency() {
  chrome.bookmarks.create({ title: 'Sorted Bookmarks' }, function(newFolder) {
    // Count bookmark frequencies
    countBookmarkFrequencies(newFolder.id);
  });
}

function countBookmarkFrequencies(folderId) {
  chrome.bookmarks.getTree(function(bookmarkTreeNodes) {
    flattenBookmarks(bookmarkTreeNodes);
    // Sort and save bookmarks by frequency
    sortAndSaveBookmarks(folderId, 'frequency');
  });
}

function sortAndSaveBookmarks(folderId, sortBy) {
  chrome.bookmarks.getTree(function(bookmarkTreeNodes) {
    let allBookmarks = flattenBookmarks(bookmarkTreeNodes);
    
    // Sort bookmarks
    let sortedBookmarks = allBookmarks.slice(); // Copy bookmarks array
    sortedBookmarks.sort(function(a, b) {
      if (sortBy === 'dateAdded') {
        return b.dateAdded - a.dateAdded;
      } else if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'lastVisitTime') {
        // Ensure lastVisitTime exists for both bookmarks
        return (b.lastVisitTime || 0) - (a.lastVisitTime || 0);
      } else if (sortBy === 'frequency') {
        // Ensure bookmarkFrequencies exists for both bookmarks
        return (bookmarkFrequencies[b.url] || 0) - (bookmarkFrequencies[a.url] || 0);
      }
    });

    // Save sorted bookmarks in the new folder
    sortedBookmarks.forEach(function(bookmark, index) {
      chrome.bookmarks.create({
        parentId: folderId,
        title: bookmark.title,
        url: bookmark.url,
        index: index
      });
    });
  });
}

function flattenBookmarks(bookmarkNodes, bookmarksList = []) {
  for (let node of bookmarkNodes) {
    if (node.url) {
      bookmarksList.push({
        title: node.title,
        url: node.url,
        dateAdded: node.dateAdded,
        lastVisitTime: node.lastVisitTime
      });
      // Increment frequency count for each bookmark URL
      bookmarkFrequencies[node.url] = (bookmarkFrequencies[node.url] || 0) + 1;
    } else if (node.children) {
      flattenBookmarks(node.children, bookmarksList);
    }
  }
  return bookmarksList;
}