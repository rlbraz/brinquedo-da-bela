using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Threading;

internal static class KeyboardBlocker
{
    private const int WhKeyboardLl = 13;
    private const int WmKeyDown = 0x0100;
    private const int WmKeyUp = 0x0101;
    private const int WmSysKeyDown = 0x0104;
    private const int WmSysKeyUp = 0x0105;
    private static readonly bool[] KeyDown = new bool[256];
    private static readonly LowLevelKeyboardProc Proc = HookCallback;
    private static IntPtr _hook = IntPtr.Zero;

    [STAThread]
    private static void Main(string[] args)
    {
        int parentPid;
        if (args.Length != 1 || !int.TryParse(args[0], out parentPid)) return;
        Console.SetOut(new System.IO.StreamWriter(Console.OpenStandardOutput()) { AutoFlush = true });

        var timer = new Timer(_ =>
        {
            try
            {
                if (Process.GetProcessById(parentPid).HasExited) Environment.Exit(0);
            }
            catch
            {
                Environment.Exit(0);
            }
        }, null, 500, 500);

        _hook = SetWindowsHookEx(WhKeyboardLl, Proc, IntPtr.Zero, 0);
        if (_hook == IntPtr.Zero) return;

        Message message;
        while (GetMessage(out message, IntPtr.Zero, 0, 0) != 0)
        {
            TranslateMessage(ref message);
            DispatchMessage(ref message);
        }

        timer.Dispose();
        UnhookWindowsHookEx(_hook);
    }

    private static IntPtr HookCallback(int code, IntPtr wParam, IntPtr lParam)
    {
        if (code >= 0)
        {
            int message = wParam.ToInt32();
            var data = Marshal.PtrToStructure<KeyboardData>(lParam);
            int vk = unchecked((int)data.VirtualKey);
            if (vk >= 0 && vk < KeyDown.Length)
            {
                if (message == WmKeyDown || message == WmSysKeyDown)
                {
                    bool repeat = KeyDown[vk];
                    KeyDown[vk] = true;
                    Console.WriteLine("{\"vk\":" + vk + ",\"repeat\":" + (repeat ? "true" : "false") + "}");
                }
                else if (message == WmKeyUp || message == WmSysKeyUp)
                {
                    KeyDown[vk] = false;
                }
            }
            return new IntPtr(1);
        }
        return CallNextHookEx(_hook, code, wParam, lParam);
    }

    private delegate IntPtr LowLevelKeyboardProc(int code, IntPtr wParam, IntPtr lParam);

    [StructLayout(LayoutKind.Sequential)]
    private struct KeyboardData
    {
        public uint VirtualKey;
        public uint ScanCode;
        public uint Flags;
        public uint Time;
        public UIntPtr ExtraInfo;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct Point { public int X; public int Y; }

    [StructLayout(LayoutKind.Sequential)]
    private struct Message
    {
        public IntPtr HWnd;
        public uint Value;
        public UIntPtr WParam;
        public IntPtr LParam;
        public uint Time;
        public Point Location;
    }

    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr SetWindowsHookEx(int hookId, LowLevelKeyboardProc callback, IntPtr module, uint threadId);
    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool UnhookWindowsHookEx(IntPtr hook);
    [DllImport("user32.dll")]
    private static extern IntPtr CallNextHookEx(IntPtr hook, int code, IntPtr wParam, IntPtr lParam);
    [DllImport("user32.dll")]
    private static extern int GetMessage(out Message message, IntPtr window, uint min, uint max);
    [DllImport("user32.dll")]
    private static extern bool TranslateMessage(ref Message message);
    [DllImport("user32.dll")]
    private static extern IntPtr DispatchMessage(ref Message message);
}
