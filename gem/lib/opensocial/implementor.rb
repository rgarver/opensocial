require 'net/https'
require 'active_support'

module OpenSocial
  module API
    class RecordNotFound < Exception; end
    
    class Implemented
      def initialize(implementor)
        @implementor = implementor
      end
    end
    
    class Implementor
      attr_accessor :token
      attr_accessor :authorization
      attr_accessor :scope
      attr_reader :error
      
      def initialize(scope)
        @scope = URI.parse(scope) unless scope.is_a?(URI)
      end
      
      def client_login(email, password)
        auth_url = URI.parse('https://www.google.com/accounts/ClientLogin')
        http = Net::HTTP.new(auth_url.host, auth_url.port)
        post = Net::HTTP::Post.new(auth_url.path)
        post.form_data = {:Email => email, :Passwd => password, 
                          :source => OpenSocial::API::Source.to_s,
                          :accountType => 'HOSTED_OR_GOOGLE', :service => 'ot'}
        http.use_ssl = true if auth_url.scheme == 'https'
        response = http.request(post)
        
        response_hash = parse_google_hash(response.body)
        unless response.code == '200'
          @error = response_hash
          return false 
        else
          @token = response_hash['Auth']
          @authorization = "GoogleLogin auth=#{@token}"
        end
      end
      
      def authsub_proxy(next_addr, opts)
        query_args = {:secure => 0, :session => 1, :scope => @scope}.merge(opts)
        query_args[:next] = next_addr
        
        returning URI.parse('https://www.google.com/accounts/AuthSubRequest') do |uri|
          uri.query = query_args.to_query
        end.to_s
      end
      
      def get(path_ext)
        req = Net::HTTP::Get.new(@scope.path + path_ext)
        connection.start do |conn|
          req['Authorization'] = @authorization
          conn.request(req)
        end
      end
      
      def people
        @people ||= OpenSocial::API::People.new(self)
      end
      
    protected
      def connection
        return @connection if defined?(@connection)
        
        returning(@connection = Net::HTTP.new(@scope.host, @scope.port)) do |http|
          http.use_ssl = true if @scope.scheme == 'https'
        end
      end
      
      def parse_google_hash(body)
        body.split("\n").inject({}) do |base, hold|
          base[hold[/^[^=]*/]] = hold[/^[^=]*=(.*)$/, 1];base
        end
      end
    end
  end
end