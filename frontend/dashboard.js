import { DashboardController } from "./js/dashboard/dashboardController.js";
import { DashboardModel } from "./js/dashboard/dashboardModel.js";
import { DashboardView } from "./js/dashboard/dashboardView.js";

const controller = new DashboardController(new DashboardModel(), new DashboardView());
controller.initialize();
