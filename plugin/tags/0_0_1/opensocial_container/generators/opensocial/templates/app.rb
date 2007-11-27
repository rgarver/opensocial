class Feeds::App < ActiveRecord::Base
  validates_uniqueness_of :source_url
  validates_presence_of :source_url
  
  attr_accessor :content, :content_type, :user_preferences
  
  def load_application!
    resp = Net::HTTP.get_response(URI.parse(self.source_url))
    document = REXML::Document.new(resp.body)
    self.update_from_source_xml(document)
    
    content = document.root.elements['/Module/Content']
    @content_type = content.attributes['type']
    @content = content.children.to_s
    
    @user_preferences = {}
    document.elements.each('/Module/UserPref') {|pref| @user_preferences[pref.attributes['name']] = pref.attributes['default_value']}
    
    self.save!
  end
  
  def update_from_source_xml(xml)
    document = xml.is_a?(REXML::Document) ? xml : REXML::Document.new(xml)
    module_prefs = document.root.elements['/Module/ModulePrefs']
    
    self.title = module_prefs.attributes['title']
    self.directory_title = module_prefs.attributes['directory_title']
    self.title_url = module_prefs.attributes['title_url']
    self.description = module_prefs.attributes['description']
    self.author = module_prefs.attributes['author']
    self.author_email = module_prefs.attributes['author_email']
    self.author_affiliation = module_prefs.attributes['author_affiliation']
    self.screenshot = module_prefs.attributes['screenshot']
    self.thumbnail = module_prefs.attributes['thumbnail']
    self.height = module_prefs.attributes['height']
    self.width = module_prefs.attributes['width']
    self.scaling = module_prefs.attributes['scaling'] == 'true' ? true : false
    self.scrolling = module_prefs.attributes['scrolling'] == 'true' ? true : false
    self.singleton = module_prefs.attributes['singleton'] == 'true' ? true : false
    self.author_photo = module_prefs.attributes['author_photo']
    self.author_aboutme = module_prefs.attributes['author_aboutme']
    self.author_link = module_prefs.attributes['author_link']
    self.author_quote = module_prefs.attributes['author_quote']
  end
end