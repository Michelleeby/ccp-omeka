# Script Name : omekaApitoCsv
# Description : This script produces a CSV file of Omeka Items given a JSON file.
# Authors     : Michelle Byrnes
# Version     : 1.0
# Notes       : Requires the Yajl library.

#### Data Definitions ####
# An apiItem is a hash with the following keys
# -- id                 : Number that is the Omeka assigned ID
# -- url                : String that is the address of the Item
# -- public             : Boolean that is true if public, else false
# -- featured           : Boolean that is true if featured, else false
# -- added              : String that is the date the Item was added
# -- modified           : String that is the date the Item was modified
# -- item_type          : Hash that is the type of the Item
# -- collection         : Hash that is the collection the Item belongs to
# -- owner              : Hash that is the owner of the Item
# -- files              : Hash that is the files associated with the Item
# -- tags               : Array that is the tag hashes
# -- element_texts      : Array that is the element_texts hashes
# -- extended_resources : Hash that is the extra related resources
#
# An item_type is a hash with the following keys
# -- id                 : Number that is the Omeka assigned item_type ID
# -- url                : String that is the address of the item_type
# -- name               : String that is the name of the item_type
# -- resource           : String that is the name of the resource group
#
# A collection is a hash with the following keys
# -- id                 : Number that is the Omeka assigned collection ID
# -- url                : String that is the address of the collection
# -- resource           : String that is the name of the resource group
#
# An owner is a hash with the following keys
# -- id                 : Number that is the Omeka assigned user ID
# -- url                : String that is the address of the user
# -- resource           : String that is the name of the resource group
#
# files is a hash with the following keys
# -- count              : Number that is total files associated with the Item.
# -- url                : String that is the address of the associated files.
# -- resource           : String that is the name of the resource group
#
# A tag is a hash with the following keys
# -- id                 : Number that is the Omeka assigned tag ID
# -- url                : String that is the address of the tag
# -- name               : String that is the name of the tag
# -- resource           : String that is the name of the resource group
#
# tag tag -> tags[ListOfTag]
#
# An element_text is a hash with the following keys
# -- html               : Boolean that is true if HTML friendly, else false
# -- text               : String that is the text of the metadata element
# -- element_set        : Hash that is the set the metadata field belongs to
# -- element            : Hash that is the info about the element
#
# element_text element_text -> element_texts[ListOfElement_Text]
#
# An element_set is a hash with the following keys
# -- id                 : Number that is the Omeka assigned element_set ID
# -- url                : String that is the address of the element_set
# -- name               : String that is the name of the element_set
# -- resource           : String that is the name of the resource group
#
# An element is a hash with the following keys
# -- id                 : Number that is the Omeka assigned element ID
# -- url                : String that is the address of the element
# -- name               : String that is the name of the element
# -- resource           : String that is the name of the resource group
#
#
# An omekaItem is a hash with the following keys
# -- ID                         : Number
# -- Public?                    : Boolean
# -- Item Type                  : String
# -- Title                      : String
# -- Description                : String
# -- Date                       : String
# -- Duration                   : String
# -- Event Type                 : String
# -- Format                     : String
# -- Coverage                   : String
# -- Convention Type            : String
# -- Meeting Place Name         : String
# -- Meeting Place Affiliation  : String
# -- Region                     : String
# -- Subject                    : String
# -- Creator                    : String
# -- Source                     : String
# -- Publisher                  : String
# -- Language                   : String
# -- Type                       : String
# -- Identifier                 : String
# -- Meeting Place Coordinates  : String
# -- Original Format            : String
# -- Notes                      : String
# -- Uniform Title              : String
# -- Relation                   : String
# -- Rights                     : String
# -- Status                     : String
# -- Contributor                : String
# -- Text                       : String
# -- Tags                       : Array

#### Libraries ####
require 'yajl'
require 'csv'

#### METHODS ####
def omekaApiToCsv

  file = "/path/to/JSON"
  writePath = "/path/to/CSV"
  json = File.new(file, 'r')
  hash = Yajl::Parser.parse(json)

  def getValues(lok, item)
    lok.map {|kee| item[kee]}
  end
  def buildItems(loi)
    omekaItemKeys = ["ID",
                     "Item Type",
                     "Public",
                     "Title",
                     "Description",
                     "Date",
                     "Duration",
                     "Event Type",
                     "Format",
                     "Coverage",
                     "Convention Type",
                     "Meeting Place Name",
                     "Meeting Place Affiliation",
                     "Region",
                     "Subject",
                     "Creator",
                     "Source",
                     "Publisher",
                     "Language",
                     "Type",
                     "Identifier",
                     "Meeting Place Coordinates",
                     "Original Format",
                     "Notes",
                     "Uniform Title",
                     "Relation",
                     "Rights",
                     "Status",
                     "Contributor",
                     "Text",
                     "Tags"]
    item_ids = loi.map {|item| {"ID" => item["id"]}}
    item_types = loi.map {|item| {"Item Type" => item["item_type"]["name"]}}
    item_public = loi.map {|item| {"Public" => item["public"]}}
    item_tags = loi.map {|item| {"Tags" => item["tags"].map {|tag| tag["name"]}} }
    element_texts = loi.map {|item| item["element_texts"]}
    elements = element_texts.map {|element_text| element_text.map {|element| {element["element"]["name"] => element["text"]} }}

    len = item_ids.length
    itemsLists = Array.new(len) {|i| elements[i].push(item_tags[i]).unshift(item_public[i]).unshift(item_types[i]).unshift(item_ids[i])}
    itemsHash = itemsLists.map {|item| item.inject {|element1, element2| element1.merge(element2)}}
    items = itemsHash.map {|item| getValues(omekaItemKeys, item)}
    output = items.unshift(omekaItemKeys)


    CSV.open(writePath, "w") do |csv|
      output.each {|item| csv << item }
    end
  end

  buildItems(hash)
end
