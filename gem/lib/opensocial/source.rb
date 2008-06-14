class String
  def to_os_source_compat
    self.gsub(/[^\w]/, '')
  end
end

module OpenSocial
  module API
    class Source
      class<<self
        attr_accessor :company
        attr_accessor :application
        attr_accessor :version
      
        def to_s
          "#{self.company.to_os_source_compat}-#{self.application.to_os_source_compat}-#{self.version.to_os_source_compat}"
        end
      end
    end
  end
end