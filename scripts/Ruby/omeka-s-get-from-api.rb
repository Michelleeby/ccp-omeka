# Script Name : omekaSGetFromAPI
# Description : This script produces a CSV file and pulls live from Omeka S API
# Authors     : Michelle Byrnes
# Version     : 1.0

### Libraries ###
require 'uri'
require 'yajl/http_stream'
require 'csv'

### Main ###
def omekaSGet
  ### Variable Helper Funcs ###
  def buildPath(name, index, grabber)
    {"metaname" => name, "index" => index, "grabber" => grabber}
  end

  def metaPath(name)
    buildPath(name, 0, "@value")
  end

  ### Variables ###
  # url building vars
  domain           = "domain/api/items"
  key_identity     = OMEKA_S_API_KEY_IDENTITY
  key_credential   = OMEKA_S_API_KEY_CREDENTIAL
  api_vals         = [key_identity, key_credential]
  # item type ids
  documents = 2
  events = 604
  names = 1470
  # total pages, 100 item per page
  totalNames = 44
  totalDocs = 2
  # Item term path vars
  termsDocs  = [{"ID"          => "o:id"},
               {"Title"       => "o:title"},
               {"Item Type"   => metaPath("dcterms:type")},
               {"Creator"     => metaPath("dcterms:creator")},
               {"Year Issued" => metaPath("dcterms:issued")},
               {"Publisher"   => metaPath("dcterms:publisher")},
               {"Spatial"     => metaPath("dcterms:spatial")},
               {"Format"      => metaPath("dcterms:format")},
               {"Extent"      => metaPath("dcterms:extent")},
               {"Rights"      => metaPath("dcterms:rights")},
               {"Has Version" => metaPath("dcterms:hasVersion")},
               {"Identifier"  => metaPath("dcterms:identifier")}]

  termsNames = [{"ID"                    => "o:id"},
               {"Full Name"             => "o:title"},
               {"First and Middle Name" => metaPath("foaf:firstName")},
               {"Last Name and Suffix"  => metaPath("foaf:lastName")},
               {"Names Location"        => metaPath("dcterms:spatial")},
               {"Gender Group"          => metaPath("foaf:gender")},
               {"Convention Role"       => metaPath("foaf:membershipClass")}]

  ### Methods ###

  # count[Number] domain[String] keys[ListOfString] type[Number] page[Number]
  # -> URLs[ListOfString]
  def buildURLs(count, domain, keys, type)
    api_key = "?key_identity=" + keys[0] + "?key_credential=" + keys[1]
    filters = "?item_set_id=#{type}&sort_by=id&sort_order=asc&page="
    endpoint = domain + api_key + filters

    Array.new(count) {|i| URI.parse(endpoint + "#{i+1}")}
  end

  # urls[ListOfString] -> hashes[ListOfHash]
  # Consumes a list of string that is the url to the items, and builds a hash
  # for each item from each given url.
  def writeHashes(urls)
    output = []
    urls.each {|url| Yajl::HttpStream.get(url) {|hash| output << hash}}
    return output.flatten
  end

  # item[Hash], key[String], path[Mixed] -> Hash
  # Consumes an item hash, a key string, and a path. The path value can be a
  # HASH or a STRING. Returns a hash with the given key/value pair.
  def goget(item, key, path)
    if path.respond_to?(:has_key?)
      {key => item.dig(path["metaname"], path["index"], path["grabber"])}
    else
      {key => item[path]}
    end
  end

  # item[Hash], terms[ListOfHash] -> Item[Hash]
  # Consumes an item and returns a new item according to the given terms.
  def buildItem(item, terms)
    kees = terms.map{|term| term.keys}.flatten
    vals = terms.map{|term| term.values}.flatten
    hashes = kees.map.with_index{|kee, i| goget(item, kee, vals[i])}

    hashes.inject {|hash1, hash2| hash1.merge(hash2)}
  end

  def buildItems(rawItems, terms)
    rawItems.map {|rawItem| buildItem(rawItem, terms)}
  end

  ### Build Variables ###
  # Depending on desired output, change totalNames to totalDesiredItemType, and change names to DesiredItemType.
  urls = buildURLs(totalNames, domain, api_vals, names)
  rawItems = writeHashes(urls)
  # Also change termsNames to match termsDesiredItemType
  items = buildItems(rawItems, termsNames)
  values = items.map {|item| item.values}
  col_headers = items[0].keys
  output = values.unshift(col_headers)

  # Write to the CSV file given above output
  CSV.open(writePath, "w") do |csv|
    output.each {|item| csv << item }
  end
end
