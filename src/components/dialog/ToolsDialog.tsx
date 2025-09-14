import { useTranslation } from "next-i18next";
import React from "react";
import {
  FaKey,
  FaThermometerFull,
} from "react-icons/fa";

import { useSettings } from "../../hooks/useSettings";
import Dialog from "../../ui/dialog";
import Input from "../../ui/input";

export const ToolsDialog: React.FC<{
  show: boolean;
  setOpen: (boolean) => void;
}> = ({ show, setOpen }) => {
  const [t] = useTranslation("settings");
  const { settings, updateSettings } = useSettings();
  return (
    <Dialog
      inline
      open={show}
      setOpen={setOpen}
      title="Experimental Targets"
      actions={
        <>
          <button
            type="button"
            className="inline-flex w-full justify-center rounded-md bg-cyan-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-400"
            onClick={() => {
              setOpen(false);
            }}
          >
            Close
          </button>
        </>
      }
    >
      {/* <p>Set the target activity and environment factors:</p>
      <br></br> */}
      <div className="flex flex-col gap-4">
        <Input
          label={`${t("Activity")}`}
          value={settings.customActivity}
          name="Activity"
          type="range"
          onChange={(e) =>
            updateSettings("customActivity", parseFloat(e.target.value))
          }
          attributes={{
            min: 1,
            max: 100,
            step: 1,
          }}
          // helpText={t("HIGHER_VALUES_MAKE_OUTPUT_MORE_RANDOM")}
          icon={<FaThermometerFull />}
          disabled={false}
        />
        <Input
            label={`${t("Thermostability")}`}
            value={settings.customThermostability}
            name="stability"
            type="range"
            onChange={(e) =>
              updateSettings("customThermostability", parseFloat(e.target.value))
            }
            attributes={{
              min: 0,
              max: 1,
              step: 0.01,
            }}
            // helpText={t("HIGHER_VALUES_MAKE_OUTPUT_MORE_RANDOM")}
            icon={<FaThermometerFull />}
            disabled={false}
        />
        <Input
            label={`${t("Ph Stability")}`}
            value={settings.customPh}
            name="Ph Stability"
            type="range"
            onChange={(e) =>
              updateSettings("customPh", parseFloat(e.target.value))
            }
            attributes={{
              min: 0,
              max: 14,
              step: 0.1,
            }}
            // helpText={t("HIGHER_VALUES_MAKE_OUTPUT_MORE_RANDOM")}
            icon={<FaThermometerFull />}
            disabled={false}
        />
        <Input
                label="Target Protein Sequence"
                name="experiment-protein-sequence"
                placeholder="protein sequence..."
                helpText={
                  <span>
                  Input the DNA sequence for the protein to be experimented here.
                  </span>
                }
                type="text"
                //todo : modify when backend is ready
                value={settings.targetProtein}
                onChange={(e) => {
                //todo : modify when backend is ready
                //  updateSettings("customApiKey", e.target.value);
                }}
                icon={<FaKey />}
                className="flex-grow-1 mr-2"
         />
         <Input
                label="Target Substrate"
                name="experiment-substrate"
                placeholder="substrate molecular..."
                helpText={
                  <span>
                  Input the substrate molecular to be experimented here.
                  </span>
                }
                type="text"
                //todo : modify when backend is ready
                value={settings.targetSubstrate}
                onChange={(e) => {
                //todo : modify when backend is ready
                //  updateSettings("customApiKey", e.target.value);
                }}
                icon={<FaKey />}
                className="flex-grow-1 mr-2"
         />
      </div>
    </Dialog>
  );
};

// interface ToolProps {
//   tool: ActiveTool;
//   onChange: (name: string, active: boolean) => void;
// }

// const GenericTool = ({ tool }: ToolProps) => {
//   return (
//     <div className="flex items-center gap-3 rounded-md border border-white/30 bg-cyan-800 p-2 px-4 text-white">
//       <ToolAvatar tool={tool} />
//       <div className="flex flex-grow flex-col gap-1">
//         <p className="font-bold capitalize">{tool.name}</p>
//         <p className="text-xs sm:text-sm">{tool.description}</p>
//       </div>
//       <Switch value={tool.active} onChange={() => {}} />
//     </div>
//   );
// };

// const SidTool = ({ tool }: ToolProps) => {
//   const { data: session } = useSession();
//   const sid = useSID(session);

//   return (
//     <div className="relative flex items-center gap-3 overflow-hidden rounded-md border border-white/30 bg-zinc-800 p-2 px-4 text-white">
//       {!sid.connected && (
//         <div className="absolute inset-0 z-10 flex items-center justify-center">
//           <div className="absolute inset-0 backdrop-blur-sm" />
//           <Button
//             className="border-white/20 bg-gradient-to-t from-amber-600 to-amber-600 transition-all hover:bg-gradient-to-t hover:from-sky-400 hover:to-sky-600"
//             onClick={sid.install}
//           >
//             Connect your Data
//           </Button>
//         </div>
//       )}
//       <ToolAvatar tool={tool} />
//       <div className="flex flex-grow flex-col gap-1">
//         <p className="font-bold capitalize">{tool.name}</p>
//         <p className="text-xs sm:text-sm">{tool.description}</p>
//       {sid.connected && (
//         <>
//           <Button onClick={sid.manage}>Manage</Button>
//           <Button
//             className="rounded-full bg-gray-700 font-semibold text-white hover:bg-gray-600"
//             onClick={sid.uninstall}
//           >
//             Disconnect
//           </Button>
//          </>
//       )}
//       </div>
//       <Switch
//         value={sid?.connected && tool.active}
//         onChange={() => {}}
//       />
//     </div>
//   );
// };

// const ToolAvatar = ({ tool }: { tool: ActiveTool }) => {
//   if (tool.image_url) {
//     // eslint-disable-next-line @next/next/no-img-element
//     return <img alt={tool.name} width="40px" height="40px" src={tool.image_url} />;
//   }

//   return <div className="h-10 w-10 rounded-full border border-white/30 bg-amber-600" />;
// };
