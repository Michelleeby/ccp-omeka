require 'http'
require 'json'
require 'csv'


##
# Definitions
##


##
# item[] (items) An array of item objects. 
# string[] (headers) Default is empty. An array of string values.
# return string[] An array of string values, or headers.
##
def build_headers(items, headers = [])
  if items.length < 1
    return headers.flatten.uniq
  end

  item = items.pop

  headers.push(item.keys)

  return build_headers(items, headers)
end


##
# string (url) The URL or API endpoint to use.
# number (index) The current iterations index.
# number (total_calls) The total number of iterations to perform.
# item[] (items) An array of item objects. Default is empty.
# return item[] An array of item objects fetched from url.
##
def build_items(url, index, total_calls, items = [])
  if index > total_calls
    return items.flatten
  end

  params = {
    :sort_by => "id", 
    :sort_order => "asc",
    :page => "#{index}"
  }

  response = JSON.parse( HTTP.get(url, :params => params).body.to_s )
  items.push(response)
  index += 1

  return build_items(url, index, total_calls, items)
end


##
# mixed (metadata_field) The metadata field value to return. 
# return mixed The metadata field value.
##
def item_metadata_handler(metadata_field)
  if metadata_field.respond_to?(:pop)
    metadata = []
    metadata_field.each do |field|
      if field.respond_to?(:has_key?) && field.has_key?("@value")
        metadata.push(field["@value"])
      else
        metadata.push(field)
      end
    end
    metadata = metadata.length == 1 ? metadata[0] : metadata
    return metadata
  elsif metadata_field.respond_to?(:has_key?) && metadata_field.has_key?("@value")
    return metadata_field["@value"]
  else
    return metadata_field
  end
end


##
# string[] (headers) An array of string, or headers.
# item[] (items) An array of item objects.
# return array[][] Headers and items as an array matrix.
##
def items_handler_csv(headers, items, out = [])
  if items.length < 1
    return [headers, out]
  end

  item = items.pop
  
  metadata = []
  
  headers.each do |header|
    if item[header]
      metadata.push(item_metadata_handler(item[header]))
    else
      metadata.push("")
    end
  end

  out.push(metadata)

  items_handler_csv(headers, items, out)
end


##
# Script Execution
##


url = "http://path.to/api/items"

total_items = HTTP.get(url).headers["Omeka-S-Total-Results"].to_i
items_per_call = 25.0
total_calls = (total_items / items_per_call).ceil

rows = items_handler_csv(
  build_headers(build_items(url, 1, total_calls)),
  build_items(url, 1, total_calls)
)

headers = rows[0]
items = rows[1]

outpath = "output.csv"

CSV.open(outpath, "w") do |file|
  file << headers

  items.each do |item|
    file << item
  end
end
