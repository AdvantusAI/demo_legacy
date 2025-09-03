import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Users, ShoppingBag, DollarSign, CreditCard, Eye, MoreHorizontal } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const statsCards = [{
  title: "Total Orders",
  value: "13,647",
  change: "+2.3%",
  period: "Last Week",
  trend: "up",
  icon: ShoppingBag,
  color: "bg-orange-100 text-orange-600"
}, {
  title: "New Leads",
  value: "9,526",
  change: "+8.1%",
  period: "Last Month",
  trend: "up",
  icon: Users,
  color: "bg-blue-100 text-blue-600"
}, {
  title: "Deals",
  value: "976",
  change: "-0.3%",
  period: "Last Month",
  trend: "down",
  icon: CreditCard,
  color: "bg-red-100 text-red-600"
}, {
  title: "Booked Revenue",
  value: "$123.6k",
  change: "-10.6%",
  period: "Last Month",
  trend: "down",
  icon: DollarSign,
  color: "bg-green-100 text-green-600"
}];
const topPages = [{
  path: "/larkon/ecommerce.html",
  views: "3K",
  rate: "4.8%",
  trend: "up"
}, {
  path: "/larkon/dashboard.html",
  views: "2.1K",
  rate: "20.4%",
  trend: "down"
}, {
  path: "/larkon/chat.html",
  views: "2K",
  rate: "10.9%",
  trend: "up"
}, {
  path: "/larkon/auth-login.html",
  views: "1.8K",
  rate: "3.2%",
  trend: "up"
}, {
  path: "/larkon/email.html",
  views: "1.2K",
  rate: "8.4%",
  trend: "down"
}, {
  path: "/larkon/social.html",
  views: "1K",
  rate: "2.4%",
  trend: "up"
}, {
  path: "/larkon/blog.html",
  views: "900",
  rate: "1.1%",
  trend: "down"
}];

export default function Dashboard() {
  return <div className="space-y-6">
      {/* Alert */}
      

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map(stat => <Card key={stat.title} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {stat.trend === "up" ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
                    <span className={`text-sm ${stat.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-muted-foreground">{stat.period}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
              <Button variant="link" className="p-0 h-auto text-sm text-primary mt-2">
                View More
              </Button>
            </CardContent>
          </Card>)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Performance</CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline">ALL</Badge>
                <Badge variant="outline">1M</Badge>
                <Badge variant="outline">6M</Badge>
                <Badge variant="outline">1Y</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Chart visualization would go here</p>
            </div>
          </CardContent>
        </Card>

        {/* Top Pages */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Top Pages</CardTitle>
              <Button variant="link" className="text-primary p-0 h-auto">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {topPages.map((page, index) => <div key={index} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{page.path}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Eye className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{page.views}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${page.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                    {page.rate}
                  </span>
                  {page.trend === "up" ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                </div>
              </div>)}
          </CardContent>
        </Card>
      </div>

      {/* Additional sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="w-32 h-32 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-orange-600">55.2%</span>
              </div>
              <p className="text-sm text-muted-foreground">Returning Customer</p>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-lg font-semibold">23.5k</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Week</p>
                  <p className="text-lg font-semibold">41.05k</p>
                </div>
              </div>
              <Button variant="link" className="text-primary">View Details</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sessions by Country</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 bg-muted/20 rounded-lg flex items-center justify-center mb-4">
              <p className="text-muted-foreground">World map visualization would go here</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-lg font-semibold">23.5k</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Week</p>
                <p className="text-lg font-semibold">41.05k</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}
