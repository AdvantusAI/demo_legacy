import { Users, TrendingUp, MessageSquare, AlertTriangle, Plus, Target, BarChart3 } from 'lucide-react';
import { useAdvancedReports } from '@/hooks/useAvancedReports';
import axios from 'axios';
import { embedDashboard } from "@superset-ui/embedded-sdk";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';



const supersetUrl = 'https://gipsy-bi.apps-m8solutions.com';
const supersetApiUrl = `${supersetUrl}/api/v1/`;

export function AdvancedReportsDashboard() {
  const [dashboardId, setDashboardId] = useState(null);
  const [dashboards, setDashboards] = useState([]);

  useEffect(() => {
    fetchDashboards();
  }, []);

  const fetchDashboards = async () => {
    try {
      const { data, error } = await supabase
        .from('embedded_dashboards')
        .select('uuid, dashboards(dashboard_title)');

      if (error) {
        throw error;
      }
      
      setDashboards(data);
    } catch (error) {
      console.error('Error fetching dashboards:', error.message);
    }
  };

  async function getToken(dashboardID) {
    if (!dashboardID) {
      console.error('No dashboard ID selected.');
      return;
    }

    try {
      // Step 1: Login to Superset
      const login_body = {
        username: "admin",
        password: "Gipsy2025!",
        provider: "db",
        refresh: true,
      };
      const login_headers = {
        headers: {
          "Content-Type": "application/json",
        }
      };

      const loginResponse = await axios.post(
        `${supersetApiUrl}security/login/`,
        login_body,
        login_headers
      );

      const access_token = loginResponse.data.access_token;

      //console.log("✅ Logged into Superset:", access_token);

      // Step 2: Generate Guest Token
      const guestTokenBody = {
        resources: [
          {
            type: "dashboard",
            id: dashboardID,
          }
        ],
        rls: [],
        user: {
          username: "sup_user",
          first_name: "superset",
          last_name: "user",
        }
      };

      const guestTokenHeaders = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        }
      };

      const guestTokenResponse = await axios.post(
        `${supersetApiUrl}/security/guest_token/`,
        guestTokenBody,
        guestTokenHeaders
      );

      const guest_token = guestTokenResponse.data.token;

      //console.log("✅ Guest token received:", guest_token);

      // Step 3: Embed the dashboard
      const container = document.getElementById("superset-container");
      if (container) {
        container.innerHTML = "";
      }

      embedDashboard({
        id: dashboardID,
        supersetDomain: supersetUrl,
        mountPoint: container,
        fetchGuestToken: () => guest_token,
        dashboardUiConfig: {
          filters: { expanded: true },
          urlParams: { standalone: 3 }
        }
      });

      // Optional: Style iframe
      const iframe = document.querySelector("iframe");
      if (iframe) {
        iframe.style.width = '100%';
        iframe.style.minHeight = '100vh';
      }
    } catch (error) {
      console.error("🚨 Error fetching guest token:", error);
    }
  }

  const { loading: advancedLoading } = useAdvancedReports();

  if (advancedLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Cargando dashboard analítica...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Analítica</h1>
          <p className="text-muted-foreground">
            Colaboración en pronósticos e inteligencia de mercado
          </p>
        </div>
      </div>

      {/* Dashboard Selector */}
      <div className="mb-4">
        <label htmlFor="dashboard-select" className="block text-sm font-medium text-gray-700">
          Selecciona un Dashboard:
        </label>
        <select
          id="dashboard-select"
          className="mt-1 block w-1/4 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-lg h-12"
          value={dashboardId || ""}
          onChange={(e) => {
            const selectedId = e.target.value;
            setDashboardId(selectedId);
            if (selectedId) {
              const container = document.getElementById("superset-container");
              if (container) {
                container.innerHTML = "";
              }
              getToken(selectedId);
            }
          }}
        >
          <option value="" disabled>
            Selecciona un dashboard
          </option>
          {dashboards.map((dashboard) => (
            <option key={dashboard.uuid} value={dashboard.uuid}>
              {dashboard.dashboards.dashboard_title}
            </option>
          ))}
        </select>
      </div>

      {/* Superset Dashboard */}
      <div id="superset-container" style={{ width: "100%", height: "600px" }}></div>
    </div>
  );
}
