import { Gate, ServiceProvider } from "bun-jcc";
import { Correspondence } from "../Models/Correspondence";
import { ForeignDiplomaticDependent } from "../Models/ForeignDiplomaticDependent";
import { ForeignDiplomaticMission } from "../Models/ForeignDiplomaticMission";
import { ForeignDiplomaticStaff } from "../Models/ForeignDiplomaticStaff";
import { LeaveApplication } from "../Models/LeaveApplication";
import { Mission } from "../Models/Mission";
import { Personnel } from "../Models/Personnel";
import { PersonnelDependent } from "../Models/PersonnelDependent";
import { Posting } from "../Models/Posting";
import { User } from "../Models/User";
import { VacationNotification } from "../Models/VacationNotification";
import { CorrespondencePolicy } from "../Policies/CorrespondencePolicy";
import { ForeignDiplomaticDependentPolicy } from "../Policies/ForeignDiplomaticDependentPolicy";
import { ForeignDiplomaticMissionPolicy } from "../Policies/ForeignDiplomaticMissionPolicy";
import { ForeignDiplomaticStaffPolicy } from "../Policies/ForeignDiplomaticStaffPolicy";
import { LeaveApplicationPolicy } from "../Policies/LeaveApplicationPolicy";
import { MissionPolicy } from "../Policies/MissionPolicy";
import { PersonnelDependentPolicy } from "../Policies/PersonnelDependentPolicy";
import { PersonnelPolicy } from "../Policies/PersonnelPolicy";
import { PostingPolicy } from "../Policies/PostingPolicy";
import { UserPolicy } from "../Policies/UserPolicy";
import { VacationNotificationPolicy } from "../Policies/VacationNotificationPolicy";

export class AppServiceProvider extends ServiceProvider {
  override async register(): Promise<void> {}

  override async boot(): Promise<void> {
    Gate.policy(Personnel, PersonnelPolicy);
    Gate.policy(PersonnelDependent, PersonnelDependentPolicy);
    Gate.policy(Mission, MissionPolicy);
    Gate.policy(Posting, PostingPolicy);
    Gate.policy(LeaveApplication, LeaveApplicationPolicy);
    Gate.policy(VacationNotification, VacationNotificationPolicy);
    Gate.policy(Correspondence, CorrespondencePolicy);
    Gate.policy(ForeignDiplomaticMission, ForeignDiplomaticMissionPolicy);
    Gate.policy(ForeignDiplomaticStaff, ForeignDiplomaticStaffPolicy);
    Gate.policy(ForeignDiplomaticDependent, ForeignDiplomaticDependentPolicy);
    Gate.policy(User, UserPolicy);
  }
}
