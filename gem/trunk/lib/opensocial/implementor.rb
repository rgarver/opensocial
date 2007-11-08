require 'net/https'
require 'active_support'

module OpenSocial
  module API
    class RecordNotFound < Exception; end
    
    class Implementor
      attr_accessor :token
      attr_accessor :authorization
      attr_accessor :scope
      
      def initialize(scope)
        @scope = URI.parse(scope) unless scope.is_a?(URI)
      end
      
      def client_login(email, password)
        auth_url = URI.parse('https://www.google.com/accounts/ClientLogin')
        http = Net::HTTP.new(auth_url.host, auth_url.port)
        post = Net::HTTP::Post.new(auth_url.path)
        post.form_data = {:Email => email, :Passwd => password, 
                          :source => OpenSocial::API::Source.to_s, :service => 'ot'}
        http.use_ssl = true if auth_url.scheme == 'https'
        resp = http.request(post)
        
        return false if resp.code != '200'
        
        @token = resp.body.split("\n").last
        @authorization = "GoogleLogin auth=#{@token}"
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
    end
  end
end