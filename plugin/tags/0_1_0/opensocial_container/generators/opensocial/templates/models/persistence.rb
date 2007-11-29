class Feeds::Persistence < ActiveRecord::Base
  belongs_to :app, :class_name => 'Feeds::App'
  belongs_to :person, :class_name => OpenSocialContainer::Configuration.person_class
  
  def self.create_from_atom(atom, params)
    doc = REXML::Document.new(atom)
    params[:key] = doc.root.elements['/entry/title'].children.to_s
    params[:value] = doc.root.elements['/entry/content'].children.to_s
    self.create(params)
  end
end